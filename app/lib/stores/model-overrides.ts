import { atom, map } from 'nanostores';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { ModelOverride, ModelOverridesStore } from '~/types/custom-models';
import { logStore } from './logs';

const STORAGE_KEY = 'bolt_model_overrides';

export const modelOverrides$ = atom<ModelOverride[]>([]);

function loadOverridesFromStorage(): ModelOverride[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      return JSON.parse(stored) as ModelOverride[];
    }
  } catch (error) {
    console.error('Failed to load model overrides:', error);
    logStore.logError('Failed to load model overrides', error);
  }

  return [];
}

function saveOverridesToStorage(overrides: ModelOverride[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    logStore.logSystem('Saved model overrides', { count: overrides.length });
  } catch (error) {
    console.error('Failed to save model overrides:', error);
    logStore.logError('Failed to save model overrides', error);
  }
}

class ModelOverridesStoreImpl implements ModelOverridesStore {
  private _overridesMap = map<Record<string, ModelOverride>>({});

  private _sync(record: Record<string, ModelOverride>) {
    this._overridesMap.set(record);
    modelOverrides$.set(Object.values(record));
  }

  constructor() {
    const initial: Record<string, ModelOverride> = {};

    if (typeof window !== 'undefined') {
      const stored = loadOverridesFromStorage();
      stored.forEach((override) => {
        initial[override.target] = override;
      });
    }

    this._sync(initial);
  }

  get overrides(): ModelOverride[] {
    return Object.values(this._overridesMap.get());
  }

  upsertOverride(
    target: string,
    provider: string,
    updates: Partial<Omit<ModelOverride, 'target' | 'provider' | 'updatedAt'>>,
  ): void {
    const current = this._overridesMap.get();
    const existing = current[target];

    const next: ModelOverride = {
      target,
      provider,
      label: updates.label ?? existing?.label,
      description: updates.description ?? existing?.description,
      maxTokenAllowed: updates.maxTokenAllowed ?? existing?.maxTokenAllowed,
      maxCompletionTokens: updates.maxCompletionTokens ?? existing?.maxCompletionTokens,
      hidden: updates.hidden ?? existing?.hidden ?? false,
      updatedAt: Date.now(),
    };

    const updated = { ...current, [target]: next };
    this._sync(updated);
    saveOverridesToStorage(Object.values(updated));

    logStore.logSystem('Updated model override', {
      target,
      provider,
      updates: Object.keys(updates),
    });
  }

  removeOverride(target: string): void {
    const current = this._overridesMap.get();

    if (!current[target]) {
      return;
    }

    const { [target]: removed, ...remaining } = current;
    this._sync(remaining);
    saveOverridesToStorage(Object.values(remaining));

    logStore.logSystem('Removed model override', { target });
  }

  toggleHidden(target: string, provider: string): void {
    const current = this._overridesMap.get();
    const existing = current[target];
    const nextHidden = !(existing?.hidden ?? false);
    this.upsertOverride(target, provider, { hidden: nextHidden });
  }

  getOverride(target: string): ModelOverride | undefined {
    return this._overridesMap.get()[target];
  }
}

export const modelOverridesStore = new ModelOverridesStoreImpl();

export function applyModelOverrides(
  models: ModelInfo[],
  overrides: ModelOverride[] = modelOverridesStore.overrides,
  options?: { includeHidden?: boolean },
): ModelInfo[] {
  if (!overrides.length) {
    return models;
  }

  const includeHidden = options?.includeHidden ?? false;
  const overrideMap = new Map(overrides.map((override) => [override.target, override]));

  const result: ModelInfo[] = [];

  models.forEach((model) => {
    const override = overrideMap.get(model.name);

    if (!override) {
      result.push(model);
      return;
    }

    if (override.hidden && !includeHidden) {
      return;
    }

    result.push({
      ...model,
      label: override.label ?? model.label,
      description: override.description ?? model.description,
      maxTokenAllowed: override.maxTokenAllowed ?? model.maxTokenAllowed,
      maxCompletionTokens: override.maxCompletionTokens ?? model.maxCompletionTokens,
    });
  });

  return result;
}
