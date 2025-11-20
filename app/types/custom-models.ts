/**
 * 自定義模型配置類型定義
 */

export interface CustomModelConfig {
  id: string; // 唯一識別符
  name: string; // 模型名稱（用於 API 調用）
  label: string; // 顯示名稱
  provider: string; // 提供商名稱
  maxTokenAllowed: number; // 最大輸入 token 數
  maxCompletionTokens?: number; // 最大輸出 token 數
  description?: string; // 模型描述
  enabled: boolean; // 是否啟用
  isReasoning?: boolean; // 是否為推理模型
  supportsTools?: boolean; // 是否支援工具調用
  supportsImages?: boolean; // 是否支援圖像
  customParams?: Record<string, any>; // 自定義參數
  createdAt: number; // 創建時間戳
  updatedAt: number; // 更新時間戳
}

export interface CustomModelsStore {
  models: CustomModelConfig[];
  addModel: (model: Omit<CustomModelConfig, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateModel: (id: string, updates: Partial<CustomModelConfig>) => void;
  deleteModel: (id: string) => void;
  toggleModel: (id: string) => void;
  getModelsByProvider: (provider: string) => CustomModelConfig[];
  getAllEnabledModels: () => CustomModelConfig[];
  importModels: (models: CustomModelConfig[]) => void;
  exportModels: () => CustomModelConfig[];
}

export interface ModelOverride {
  target: string; // 目標系統模型名稱
  provider: string;
  label?: string;
  description?: string;
  maxTokenAllowed?: number;
  maxCompletionTokens?: number;
  hidden?: boolean;
  updatedAt: number;
}

export interface ModelOverridesStore {
  overrides: ModelOverride[];
  upsertOverride: (
    target: string,
    provider: string,
    updates: Partial<Omit<ModelOverride, 'target' | 'provider' | 'updatedAt'>>,
  ) => void;
  removeOverride: (target: string) => void;
  toggleHidden: (target: string, provider: string) => void;
  getOverride: (target: string) => ModelOverride | undefined;
}
