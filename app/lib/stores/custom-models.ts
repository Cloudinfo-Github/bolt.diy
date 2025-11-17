import { atom, map } from 'nanostores';
import type { CustomModelConfig, CustomModelsStore } from '~/types/custom-models';
import { logStore } from './logs';

const STORAGE_KEY = 'bolt_custom_models';

// Reactive list of custom models for UI consumption
export const customModels$ = atom<CustomModelConfig[]>([]);

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

function generateId(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

class CustomModelsStoreImpl implements CustomModelsStore {
  private _modelsMap = map<Record<string, CustomModelConfig>>({});

  private _sync(record: Record<string, CustomModelConfig>) {
    this._modelsMap.set(record);
    customModels$.set(Object.values(record));
  }

  constructor() {
    const initialRecord: Record<string, CustomModelConfig> = {};

    if (typeof window !== 'undefined') {
      const models = loadModelsFromStorage();
      models.forEach((model) => {
        initialRecord[model.id] = model;
      });
    }

    this._sync(initialRecord);
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
}

export const customModelsStore = new CustomModelsStoreImpl();
