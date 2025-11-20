import { atom, map } from 'nanostores';
import type { CustomModelConfig, CustomModelsStore } from '~/types/custom-models';
import { logStore } from './logs';

const STORAGE_KEY = 'bolt_custom_models';
const SYNC_DEBOUNCE_MS = 1000; // 防抖時間

// Reactive list of custom models for UI consumption
export const customModels$ = atom<CustomModelConfig[]>([]);

// 同步狀態
export const syncStatus$ = atom<'idle' | 'syncing' | 'success' | 'error'>('idle');
export const lastSyncTime$ = atom<number>(0);

let syncTimeout: NodeJS.Timeout | null = null;

function loadModelsFromStorage(): CustomModelConfig[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      const models = JSON.parse(stored);
      logStore.logSystem('Loaded custom models from storage', { count: models.length });

      return models;
    }
  } catch (error) {
    console.error('Failed to load custom models:', error);
    logStore.logError('Failed to load custom models', error);
  }

  return [];
}

function saveModelsToStorage(models: CustomModelConfig[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
    logStore.logSystem('Saved custom models to storage', { count: models.length });
  } catch (error) {
    console.error('Failed to save custom models:', error);
    logStore.logError('Failed to save custom models', error);
  }
}

// 同步到後端
async function syncModelsToBackend(models: CustomModelConfig[]): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    syncStatus$.set('syncing');

    const response = await fetch('/api/custom-models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ models }),
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }

    const result = await response.json();
    syncStatus$.set('success');
    lastSyncTime$.set(Date.now());

    logStore.logSystem('Synced custom models to backend', {
      count: models.length,
      result,
    });
  } catch (error) {
    console.error('Failed to sync custom models to backend:', error);
    syncStatus$.set('error');
    logStore.logError('Failed to sync custom models to backend', error);
  }
}

// 防抖同步
function debouncedSync(models: CustomModelConfig[]): void {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(() => {
    syncModelsToBackend(models);
  }, SYNC_DEBOUNCE_MS);
}

// 從後端載入模型
async function loadModelsFromBackend(): Promise<CustomModelConfig[]> {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const response = await fetch('/api/custom-models');

    if (!response.ok) {
      throw new Error(`Load failed: ${response.statusText}`);
    }

    const result = (await response.json()) as {
      success: boolean;
      models: CustomModelConfig[];
      source?: string;
    };

    if (result.success && Array.isArray(result.models)) {
      logStore.logSystem('Loaded custom models from backend', {
        count: result.models.length,
        source: result.source || 'unknown',
      });
      return result.models;
    }
  } catch (error) {
    console.error('Failed to load custom models from backend:', error);
    logStore.logError('Failed to load custom models from backend', error);
  }

  return [];
}

function generateId(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

class CustomModelsStoreImpl implements CustomModelsStore {
  private _modelsMap = map<Record<string, CustomModelConfig>>({});
  private _initialized = false;

  private _sync(record: Record<string, CustomModelConfig>, skipBackendSync = false) {
    this._modelsMap.set(record);

    const models = Object.values(record);
    customModels$.set(models);

    // 自動同步到後端（防抖）
    if (!skipBackendSync && this._initialized) {
      debouncedSync(models);
    }
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  // 初始化：優先從後端載入，如果失敗則從 localStorage 載入
  async initialize(): Promise<void> {
    if (this._initialized) {
      return;
    }

    const initialRecord: Record<string, CustomModelConfig> = {};

    try {
      // 1. 先嘗試從後端載入
      const backendModels = await loadModelsFromBackend();

      if (backendModels.length > 0) {
        backendModels.forEach((model) => {
          initialRecord[model.id] = model;
        });

        // 同步到 localStorage
        saveModelsToStorage(backendModels);
        logStore.logSystem('Initialized from backend', { count: backendModels.length });
      } else {
        // 2. 如果後端沒有數據，從 localStorage 載入
        const localModels = loadModelsFromStorage();

        if (localModels.length > 0) {
          localModels.forEach((model) => {
            initialRecord[model.id] = model;
          });

          // 同步到後端
          syncModelsToBackend(localModels);
          logStore.logSystem('Initialized from localStorage', { count: localModels.length });
        }
      }
    } catch (error) {
      console.error('Initialization error, falling back to localStorage:', error);

      // 3. 出錯時使用 localStorage
      const localModels = loadModelsFromStorage();
      localModels.forEach((model) => {
        initialRecord[model.id] = model;
      });
    }

    this._sync(initialRecord, true); // 初始化時不觸發同步
    this._initialized = true;
  }

  get models(): CustomModelConfig[] {
    return Object.values(this._modelsMap.get());
  }

  addModel(modelData: Omit<CustomModelConfig, 'id' | 'createdAt' | 'updatedAt'>): void {
    const now = Date.now();
    const newModel: CustomModelConfig = {
      ...modelData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    const current = this._modelsMap.get();
    const updated = {
      ...current,
      [newModel.id]: newModel,
    };

    this._sync(updated);
    saveModelsToStorage(Object.values(updated));

    logStore.logSystem('Added custom model', {
      id: newModel.id,
      name: newModel.name,
      provider: newModel.provider,
    });
  }

  updateModel(id: string, updates: Partial<CustomModelConfig>): void {
    const current = this._modelsMap.get();
    const existing = current[id];

    if (!existing) {
      console.warn(`Model ${id} not found`);
      return;
    }

    const updated = {
      ...current,
      [id]: {
        ...existing,
        ...updates,
        updatedAt: Date.now(),
      },
    };

    this._sync(updated);
    saveModelsToStorage(Object.values(updated));

    logStore.logSystem('Updated custom model', { id, updates: Object.keys(updates) });
  }

  deleteModel(id: string): void {
    const current = this._modelsMap.get();
    const { [id]: deleted, ...remaining } = current;

    if (deleted) {
      this._sync(remaining);
      saveModelsToStorage(Object.values(remaining));
      logStore.logSystem('Deleted custom model', { id, name: deleted.name });
    }
  }

  toggleModel(id: string): void {
    const current = this._modelsMap.get();
    const model = current[id];

    if (model) {
      this.updateModel(id, { enabled: !model.enabled });
    }
  }

  getModelsByProvider(provider: string): CustomModelConfig[] {
    return this.models.filter((model) => model.provider === provider);
  }

  getAllEnabledModels(): CustomModelConfig[] {
    return this.models.filter((model) => model.enabled);
  }

  importModels(models: CustomModelConfig[]): void {
    const current = this._modelsMap.get();
    const updated = { ...current };

    models.forEach((model) => {
      const importedModel: CustomModelConfig = {
        ...model,
        createdAt: model.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
      updated[model.id] = importedModel;
    });

    this._sync(updated);
    saveModelsToStorage(Object.values(updated));
    logStore.logSystem('Imported custom models', { count: models.length });
  }

  exportModels(): CustomModelConfig[] {
    return this.models;
  }

  // 手動同步到後端
  async syncToBackend(): Promise<void> {
    const models = this.models;
    await syncModelsToBackend(models);
  }

  // 手動從後端重新載入
  async reloadFromBackend(): Promise<void> {
    const backendModels = await loadModelsFromBackend();

    if (backendModels.length > 0) {
      const record: Record<string, CustomModelConfig> = {};
      backendModels.forEach((model) => {
        record[model.id] = model;
      });

      this._sync(record, true); // 不觸發反向同步
      saveModelsToStorage(backendModels);
      logStore.logSystem('Reloaded from backend', { count: backendModels.length });
    }
  }
}

export const customModelsStore = new CustomModelsStoreImpl();

// 自動初始化（僅在瀏覽器環境）
if (typeof window !== 'undefined') {
  customModelsStore.initialize();
}
