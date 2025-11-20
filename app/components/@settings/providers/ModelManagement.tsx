/**
 * 模型管理界面組件
 * 允許用戶添加、編輯和刪除自定義模型配置
 */

import { useStore } from '@nanostores/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { customModels$, customModelsStore, syncStatus$, lastSyncTime$ } from '~/lib/stores/custom-models';
import { modelOverrides$, modelOverridesStore } from '~/lib/stores/model-overrides';
import type { CustomModelConfig, ModelOverride } from '~/types/custom-models';
import type { ModelInfo } from '~/lib/modules/llm/types';
import { toast } from 'react-toastify';

export function ModelManagement() {
  const models = useStore(customModels$);
  const overrides = useStore(modelOverrides$);
  const syncStatus = useStore(syncStatus$);
  const lastSyncTime = useStore(lastSyncTime$);
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [editingModel, setEditingModel] = useState<CustomModelConfig | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [isSystemLoading, setIsSystemLoading] = useState(true);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [systemEditorModel, setSystemEditorModel] = useState<ModelInfo | null>(null);
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set());

  /*
   * const [showHiddenModels, setShowHiddenModels] = useState(false);
   */

  const overridesMap = useMemo(() => {
    return overrides.reduce<Record<string, ModelOverride>>((acc, override) => {
      acc[override.target] = override;
      return acc;
    }, {});
  }, [overrides]);

  /*
   * const sortedSystemModels = useMemo(() => {
   *   return [...systemModels].sort((a, b) => {
   *     if (a.provider === b.provider) {
   *       return (a.label || a.name).localeCompare(b.label || b.name);
   *     }
   *
   *     return a.provider.localeCompare(b.provider);
   *   });
   * }, [systemModels]);
   *
   * const annotatedSystemModels = useMemo(
   *   () =>
   *     sortedSystemModels.map((model) => ({
   *       model,
   *       override: overridesMap[model.name],
   *     })),
   *   [sortedSystemModels, overridesMap],
   * );
   */

  // 將自訂模型中已啟用的 AzureOpenAI 模型作為系統模型列表
  const allSystemModels = useMemo(() => {
    const customAzureModels = models
      .filter((m) => m.enabled && m.provider === 'AzureOpenAI')
      .map((m) => ({
        model: {
          name: m.name,
          label: m.label,
          provider: m.provider,
          maxTokenAllowed: m.maxTokenAllowed,
          maxCompletionTokens: m.maxCompletionTokens,
          description: m.description,
        } as ModelInfo,
        override: overridesMap[m.name],
        isCustom: true,
        customModelId: m.id,
      }));

    return customAzureModels;
  }, [models, overridesMap]);

  const groupedSystemModels = useMemo(() => {
    const groups = new Map<
      string,
      Array<{ model: ModelInfo; override?: ModelOverride; isCustom?: boolean; customModelId?: string }>
    >();

    allSystemModels.forEach((item) => {
      const provider = item.model.provider;

      if (!groups.has(provider)) {
        groups.set(provider, []);
      }

      groups.get(provider)!.push(item);
    });

    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [allSystemModels]);

  const toggleProvider = (provider: string) => {
    setExpandedProviders((prev) => {
      const next = new Set(prev);

      if (next.has(provider)) {
        next.delete(provider);
      } else {
        next.add(provider);
      }

      return next;
    });
  };

  const loadSystemModels = useCallback(async () => {
    setIsSystemLoading(true);
    setSystemError(null);

    try {
      const response = await fetch('/api/models');

      if (!response.ok) {
        throw new Error(`Failed to load system models: ${response.status}`);
      }

      await response.json(); // Response not currently used

      /*
       * Note: systemModels state was removed as models now come from custom models list
       * const data = (await response.json()) as { modelList: ModelInfo[] };
       * setSystemModels(data.modelList);
       */
    } catch (error) {
      console.error('Error loading system models:', error);
      setSystemError('無法載入系統模型，請稍後再試');
    } finally {
      setIsSystemLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSystemModels();
  }, [loadSystemModels]);

  // 獲取所有提供商列表
  const providers = Array.from(new Set(models.map((m) => m.provider))).sort();

  // 過濾模型
  const filteredModels = models.filter((model) => {
    const matchesSearch =
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.label.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvider = filterProvider === 'all' || model.provider === filterProvider;

    return matchesSearch && matchesProvider;
  });

  const handleAddModel = () => {
    setEditingModel(null);
    setIsAddingModel(true);
  };

  const handleEditModel = (model: CustomModelConfig) => {
    setEditingModel(model);
    setIsAddingModel(true);
  };

  const handleDeleteModel = (id: string) => {
    if (confirm('確定要刪除此模型嗎？')) {
      customModelsStore.deleteModel(id);
      toast.success('模型已刪除');
    }
  };

  const handleToggleModel = (id: string) => {
    customModelsStore.toggleModel(id);
  };

  const handleExport = () => {
    const data = customModelsStore.exportModels();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bolt-custom-models-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('模型配置已導出');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          customModelsStore.importModels(data);
          toast.success(`成功導入 ${data.length} 個模型`);
        } catch (error) {
          toast.error('導入失敗：文件格式錯誤');
          console.error('Import error:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSystemEdit = (model: ModelInfo) => {
    setSystemEditorModel(model);
  };

  const handleSystemToggle = (model: ModelInfo) => {
    const nextHidden = !(overridesMap[model.name]?.hidden ?? false);
    modelOverridesStore.toggleHidden(model.name, model.provider);
    toast.success(nextHidden ? '模型已隱藏於選單' : '模型已重新顯示');
  };

  const handleSystemReset = (model: ModelInfo) => {
    if (!overridesMap[model.name]) {
      toast.info('此模型尚未自訂設定，無需清除');
      return;
    }

    if (
      confirm(
        `確定要清除「${model.label || model.name}」的所有自訂設定嗎？\n\n此操作會移除覆寫設定，模型將恢復為系統預設值。`,
      )
    ) {
      modelOverridesStore.removeOverride(model.name);
      toast.success('已清除自訂設定');
    }
  };

  const handleResetAllOverrides = () => {
    const count = overrides.length;

    if (count === 0) {
      toast.info('目前沒有任何自訂設定需要清除');
      return;
    }

    if (
      confirm(`確定要清除所有 ${count} 個模型的自訂設定嗎？\n\n此操作會將所有模型恢復為系統預設值，包括已隱藏的模型。`)
    ) {
      // 清空所有 overrides
      if (typeof window !== 'undefined') {
        localStorage.removeItem('bolt_model_overrides');
        window.location.reload();
      }
    }
  };

  const handleSystemEditorClose = () => {
    setSystemEditorModel(null);
  };

  const handleSystemEditorSave = ({ updates, remove }: SystemOverridePayload) => {
    if (!systemEditorModel) {
      return;
    }

    if (remove) {
      modelOverridesStore.removeOverride(systemEditorModel.name);
      toast.success('已還原此模型設定');
    } else {
      modelOverridesStore.upsertOverride(systemEditorModel.name, systemEditorModel.provider, updates);
      toast.success('系統模型設定已更新');
    }

    setSystemEditorModel(null);
  };

  // 手動同步到後端
  const handleManualSync = async () => {
    try {
      await customModelsStore.syncToBackend();
      toast.success('同步成功！');
    } catch (error) {
      toast.error('同步失敗，請稍後再試');
      console.error('Manual sync failed:', error);
    }
  };

  // 從後端重新載入
  const handleReloadFromBackend = async () => {
    try {
      await customModelsStore.reloadFromBackend();
      toast.success('已從後端重新載入模型！');
    } catch (error) {
      toast.error('載入失敗，請稍後再試');
      console.error('Reload from backend failed:', error);
    }
  };

  // 格式化同步時間
  const formatSyncTime = (timestamp: number) => {
    if (!timestamp) {
      return '尚未同步';
    }

    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) {
      return '剛剛';
    }

    if (minutes < 60) {
      return `${minutes} 分鐘前`;
    }

    if (hours < 24) {
      return `${hours} 小時前`;
    }

    return new Date(timestamp).toLocaleString('zh-TW');
  };

  return (
    <div className="p-4 space-y-8">
      {/* 同步狀態指示器 */}
      <div className="bg-bolt-elements-background-depth-2 rounded-lg p-4 border border-bolt-elements-borderColor">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {syncStatus === 'syncing' && <div className="i-ph:spinner-gap animate-spin text-blue-400" />}
              {syncStatus === 'success' && <div className="i-ph:check-circle text-green-400" />}
              {syncStatus === 'error' && <div className="i-ph:warning-circle text-red-400" />}
              {syncStatus === 'idle' && <div className="i-ph:database text-bolt-elements-textSecondary" />}
              <span className="text-sm font-medium text-bolt-elements-textPrimary">
                {syncStatus === 'syncing' && '正在同步...'}
                {syncStatus === 'success' && '已同步'}
                {syncStatus === 'error' && '同步失敗'}
                {syncStatus === 'idle' && '後端同步'}
              </span>
            </div>
            <span className="text-xs text-bolt-elements-textSecondary">最後同步：{formatSyncTime(lastSyncTime)}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReloadFromBackend}
              className="px-3 py-1.5 text-sm bg-bolt-elements-button-secondary-background text-bolt-elements-button-secondary-text rounded hover:bg-bolt-elements-button-secondary-backgroundHover transition-colors"
              title="從後端重新載入"
            >
              <div className="flex items-center gap-1.5">
                <div className="i-ph:download-simple" />
                <span>從後端載入</span>
              </div>
            </button>
            <button
              onClick={handleManualSync}
              disabled={syncStatus === 'syncing'}
              className="px-3 py-1.5 text-sm bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text rounded hover:bg-bolt-elements-button-primary-backgroundHover transition-colors disabled:opacity-60"
              title="手動同步到後端"
            >
              <div className="flex items-center gap-1.5">
                <div className={syncStatus === 'syncing' ? 'i-ph:spinner-gap animate-spin' : 'i-ph:cloud-arrow-up'} />
                <span>同步到後端</span>
              </div>
            </button>
          </div>
        </div>
        <p className="text-xs text-bolt-elements-textSecondary mt-2">
          💡 自訂模型會自動同步到後端，重新載入頁面時會從後端恢復。如需手動同步，請點擊上方按鈕。
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-bolt-elements-textPrimary">系統內建模型</h2>
            <p className="text-sm text-bolt-elements-textSecondary mt-1">
              檢視目前載入的模型清單，必要時可覆寫描述或隱藏不需要的項目
            </p>
          </div>
          <div className="flex gap-2">
            {overrides.length > 0 && (
              <button
                onClick={handleResetAllOverrides}
                className="px-4 py-2 bg-red-500/10 text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="i-ph:trash" />
                  <span>全部重置 ({overrides.length})</span>
                </div>
              </button>
            )}
            <button
              onClick={() => void loadSystemModels()}
              disabled={isSystemLoading}
              className="px-4 py-2 bg-bolt-elements-button-secondary-background text-bolt-elements-button-secondary-text rounded-lg hover:bg-bolt-elements-button-secondary-backgroundHover transition-colors disabled:opacity-60"
            >
              <div className="flex items-center gap-2">
                <div className={isSystemLoading ? 'i-ph:spinner-gap animate-spin' : 'i-ph:arrow-clockwise'} />
                <span>{isSystemLoading ? '載入中...' : '重新整理'}</span>
              </div>
            </button>
          </div>
        </div>
        {systemError && (
          <div className="p-3 rounded-lg border border-red-400/40 bg-red-500/10 text-sm text-red-200">
            {systemError}
          </div>
        )}
        <div className="space-y-3 max-h-[480px] overflow-y-auto modern-scrollbar pr-2">
          {isSystemLoading && groupedSystemModels.length === 0 ? (
            <div className="text-center py-12 text-bolt-elements-textSecondary">正在載入系統模型…</div>
          ) : groupedSystemModels.length === 0 ? (
            <div className="text-center py-12 text-bolt-elements-textSecondary">尚未取得任何系統模型</div>
          ) : (
            groupedSystemModels.map(([provider, models]) => {
              const isExpanded = expandedProviders.has(provider);
              const modelCount = models.length;
              const hiddenCount = models.filter((m) => m.override?.hidden).length;

              return (
                <div key={provider} className="border border-bolt-elements-borderColor rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleProvider(provider)}
                    className="w-full px-4 py-3 bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`i-ph:caret-right text-xl transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      />
                      <h3 className="font-semibold text-bolt-elements-textPrimary">{provider}</h3>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary">
                        {modelCount} 個模型
                      </span>
                      {hiddenCount > 0 && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-300">
                          {hiddenCount} 已隱藏
                        </span>
                      )}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="p-2 space-y-2 bg-bolt-elements-background-depth-1">
                      {models.map(({ model, override, isCustom, customModelId }) => (
                        <SystemModelCard
                          key={`${model.provider}-${model.name}`}
                          model={model}
                          override={override}
                          isCustom={isCustom}
                          onEdit={() => handleSystemEdit(model)}
                          onToggle={() => handleSystemToggle(model)}
                          onReset={() => handleSystemReset(model)}
                          onDelete={() => {
                            if (customModelId) {
                              handleDeleteModel(customModelId);
                            }
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="space-y-4 border-t border-bolt-elements-borderColor pt-6">
        {/* 標題和操作按鈕 */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-bolt-elements-textPrimary">自定義模型管理</h2>
            <p className="text-sm text-bolt-elements-textSecondary mt-1">添加和管理您的自定義 AI 模型配置</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-bolt-elements-button-secondary-background text-bolt-elements-button-secondary-text rounded-lg hover:bg-bolt-elements-button-secondary-backgroundHover transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="i-ph:download-simple" />
                <span>導出</span>
              </div>
            </button>
            <label className="px-4 py-2 bg-bolt-elements-button-secondary-background text-bolt-elements-button-secondary-text rounded-lg hover:bg-bolt-elements-button-secondary-backgroundHover transition-colors cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="i-ph:upload-simple" />
                <span>導入</span>
              </div>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <button
              onClick={handleAddModel}
              className="px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="i-ph:plus" />
                <span>添加模型</span>
              </div>
            </button>
          </div>
        </div>

        {/* 搜索和過濾 */}
        <div className="flex gap-3">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 i-ph:magnifying-glass text-bolt-elements-textSecondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索模型名稱..."
                className="w-full pl-10 pr-4 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary placeholder:text-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
          </div>
          <select
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}
            className="px-4 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
            <option value="all">所有提供商</option>
            {providers.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>
        </div>

        {/* 模型列表 */}
        <div className="space-y-2">
          {filteredModels.length === 0 ? (
            <div className="text-center py-12 text-bolt-elements-textSecondary">
              <div className="i-ph:database text-4xl mx-auto mb-3 opacity-50" />
              <p>尚未添加任何自定義模型</p>
              <p className="text-sm mt-1">點擊上方「添加模型」按鈕開始</p>
            </div>
          ) : (
            filteredModels.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                onEdit={() => handleEditModel(model)}
                onDelete={() => handleDeleteModel(model.id)}
                onToggle={() => handleToggleModel(model.id)}
              />
            ))
          )}
        </div>
      </section>

      {systemEditorModel && (
        <SystemModelEditor
          model={systemEditorModel}
          override={overridesMap[systemEditorModel.name]}
          onClose={handleSystemEditorClose}
          onSave={handleSystemEditorSave}
        />
      )}

      {/* 添加/編輯模型對話框 */}
      {isAddingModel && (
        <ModelEditor
          model={editingModel}
          onClose={() => {
            setIsAddingModel(false);
            setEditingModel(null);
          }}
          onSave={(modelData) => {
            if (editingModel) {
              customModelsStore.updateModel(editingModel.id, modelData);
              toast.success('模型已更新');
            } else {
              customModelsStore.addModel(modelData);
              toast.success('模型已添加');
            }

            setIsAddingModel(false);
            setEditingModel(null);
          }}
        />
      )}
    </div>
  );
}

interface SystemOverridePayload {
  updates: Partial<Omit<ModelOverride, 'target' | 'provider' | 'updatedAt'>>;
  remove?: boolean;
}

interface SystemModelCardProps {
  model: ModelInfo;
  override?: ModelOverride;
  isCustom?: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onReset: () => void;
  onDelete: () => void;
}

function SystemModelCard({ model, override, isCustom, onEdit, onToggle, onReset, onDelete }: SystemModelCardProps) {
  const effectiveLabel = override?.label ?? model.label ?? model.name;
  const effectiveDescription = override?.description ?? model.description;
  const effectiveInput = override?.maxTokenAllowed ?? model.maxTokenAllowed;
  const effectiveOutput = override?.maxCompletionTokens ?? model.maxCompletionTokens;
  const isHidden = override?.hidden ?? false;
  const hasOverride = Boolean(
    override?.label ||
      override?.description ||
      override?.maxTokenAllowed ||
      override?.maxCompletionTokens ||
      override?.hidden,
  );

  return (
    <div
      className={`p-4 bg-bolt-elements-background-depth-2 border rounded-lg transition-all ${
        isHidden ? 'opacity-60 border-dashed border-bolt-elements-borderColor' : 'border-bolt-elements-borderColor'
      }`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="font-semibold text-bolt-elements-textPrimary">{effectiveLabel}</h3>
            <span className="px-2 py-0.5 text-xs rounded-full bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary">
              {model.provider}
            </span>
            {isHidden && <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-300">已隱藏</span>}
            {!isHidden && hasOverride && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-300">已自訂</span>
            )}
            {isCustom && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-300">自訂</span>
            )}
          </div>
          <p className="text-sm text-bolt-elements-textSecondary mb-1">
            模型 ID：{' '}
            <code className="text-xs bg-bolt-elements-background-depth-3 px-1.5 py-0.5 rounded">{model.name}</code>
          </p>
          <p className="text-xs text-bolt-elements-textTertiary mb-2">
            輸入 {effectiveInput?.toLocaleString() ?? '—'} tokens • 輸出 {effectiveOutput?.toLocaleString() ?? '—'}{' '}
            tokens
          </p>
          {effectiveDescription && (
            <p className="text-sm text-bolt-elements-textSecondary">
              {effectiveDescription}
              {override?.description && (
                <span className="text-xs text-bolt-elements-textTertiary ml-2">（自訂描述）</span>
              )}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <button
            onClick={onToggle}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              isHidden
                ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                : 'bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-4'
            }`}
          >
            {isHidden ? '重新顯示' : '從選單隱藏'}
          </button>
          <button
            onClick={onEdit}
            className="px-3 py-2 rounded-lg bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-4 text-sm transition-colors"
          >
            編輯設定
          </button>
          <button
            onClick={onReset}
            disabled={!hasOverride}
            className="px-3 py-2 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title={hasOverride ? '清除此模型的所有自訂設定' : '此模型尚未自訂'}
          >
            重置為預設
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm transition-colors"
            title={isCustom ? '從自訂模型列表中刪除' : '從系統移除此模型（標記為永久隱藏）'}
          >
            {isCustom ? '刪除' : '移除'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface SystemModelEditorProps {
  model: ModelInfo;
  override?: ModelOverride;
  onClose: () => void;
  onSave: (payload: SystemOverridePayload) => void;
}

function SystemModelEditor({ model, override, onClose, onSave }: SystemModelEditorProps) {
  const [formData, setFormData] = useState({
    label: override?.label ?? model.label ?? model.name,
    description: override?.description ?? model.description ?? '',
    maxTokenAllowed: override?.maxTokenAllowed ?? model.maxTokenAllowed,
    maxCompletionTokens: override?.maxCompletionTokens ?? model.maxCompletionTokens ?? undefined,
    hidden: override?.hidden ?? false,
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const sanitized: Partial<Omit<ModelOverride, 'target' | 'provider' | 'updatedAt'>> = {
      label: formData.label && formData.label !== (model.label ?? model.name) ? formData.label.trim() : undefined,
      description: formData.description?.trim() || undefined,
      maxTokenAllowed:
        formData.maxTokenAllowed && formData.maxTokenAllowed !== model.maxTokenAllowed
          ? formData.maxTokenAllowed
          : undefined,
      maxCompletionTokens:
        formData.maxCompletionTokens && formData.maxCompletionTokens !== model.maxCompletionTokens
          ? formData.maxCompletionTokens
          : undefined,
      hidden: formData.hidden,
    };

    const hasCustomValue = Boolean(
      sanitized.hidden ||
        sanitized.label !== undefined ||
        sanitized.description !== undefined ||
        sanitized.maxTokenAllowed !== undefined ||
        sanitized.maxCompletionTokens !== undefined,
    );

    onSave({ updates: sanitized, remove: !hasCustomValue });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-bolt-elements-background-depth-1 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-bolt-elements-background-depth-1 border-b border-bolt-elements-borderColor p-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-bolt-elements-textPrimary">調整系統模型</h3>
            <p className="text-sm text-bolt-elements-textSecondary">
              {model.provider} · {model.name}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-bolt-elements-background-depth-2">
            <div className="i-ph:x text-xl text-bolt-elements-textSecondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-1">顯示名稱</label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
              <p className="text-xs text-bolt-elements-textTertiary mt-1">留空將使用系統預設名稱</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-1">輸入 Token 上限</label>
              <input
                type="number"
                value={formData.maxTokenAllowed ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxTokenAllowed: e.target.value ? parseInt(e.target.value) : (undefined as any),
                  })
                }
                className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-1">輸出 Token 上限</label>
              <input
                type="number"
                value={formData.maxCompletionTokens ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxCompletionTokens: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                id="system-model-hidden"
                type="checkbox"
                checked={formData.hidden}
                onChange={(e) => setFormData({ ...formData, hidden: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="system-model-hidden" className="text-sm text-bolt-elements-textPrimary">
                隱藏此模型（仍可透過還原顯示）
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-1">自訂描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
            <p className="text-xs text-bolt-elements-textTertiary mt-1">留空則沿用系統原始描述</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-bolt-elements-borderColor">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-3"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition-colors"
            >
              儲存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ModelCardProps {
  model: CustomModelConfig;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}

function ModelCard({ model, onEdit, onDelete, onToggle }: ModelCardProps) {
  return (
    <div
      className={`p-4 bg-bolt-elements-background-depth-2 border rounded-lg transition-all ${
        model.enabled ? 'border-bolt-elements-borderColor' : 'border-bolt-elements-borderColor opacity-60'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-bolt-elements-textPrimary">{model.label}</h3>
            <span className="px-2 py-0.5 text-xs rounded-full bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary">
              {model.provider}
            </span>
            {model.isReasoning && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-400">🧠 推理模型</span>
            )}
          </div>
          <p className="text-sm text-bolt-elements-textSecondary mb-2">
            模型名稱：
            <code className="text-xs bg-bolt-elements-background-depth-3 px-1.5 py-0.5 rounded">{model.name}</code>
          </p>
          {model.description && <p className="text-sm text-bolt-elements-textTertiary mb-2">{model.description}</p>}
          <div className="flex flex-wrap gap-3 text-xs text-bolt-elements-textTertiary">
            <span>輸入：{model.maxTokenAllowed.toLocaleString()} tokens</span>
            {model.maxCompletionTokens && <span>輸出：{model.maxCompletionTokens.toLocaleString()} tokens</span>}
            {model.supportsTools && <span>✓ 支援工具</span>}
            {model.supportsImages && <span>✓ 支援圖像</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className={`p-2 rounded-lg transition-colors ${
              model.enabled
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                : 'bg-bolt-elements-background-depth-3 text-bolt-elements-textTertiary hover:bg-bolt-elements-background-depth-4'
            }`}
            title={model.enabled ? '停用' : '啟用'}
          >
            <div className={model.enabled ? 'i-ph:toggle-right-fill' : 'i-ph:toggle-left'} />
          </button>
          <button
            onClick={onEdit}
            className="p-2 rounded-lg bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-4 hover:text-bolt-elements-textPrimary transition-colors"
            title="編輯"
          >
            <div className="i-ph:pencil-simple" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary hover:bg-red-500/20 hover:text-red-400 transition-colors"
            title="刪除"
          >
            <div className="i-ph:trash" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface ModelEditorProps {
  model: CustomModelConfig | null;
  onClose: () => void;
  onSave: (model: Omit<CustomModelConfig, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

function ModelEditor({ model, onClose, onSave }: ModelEditorProps) {
  const [formData, setFormData] = useState({
    name: model?.name || '',
    label: model?.label || '',
    provider: model?.provider || 'AzureOpenAI',
    maxTokenAllowed: model?.maxTokenAllowed || 128000,
    maxCompletionTokens: model?.maxCompletionTokens,
    description: model?.description || '',
    enabled: model?.enabled ?? true,
    isReasoning: model?.isReasoning || false,
    supportsTools: model?.supportsTools ?? true,
    supportsImages: model?.supportsImages || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.label || !formData.provider) {
      toast.error('請填寫所有必填欄位');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-bolt-elements-background-depth-1 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-bolt-elements-background-depth-1 border-b border-bolt-elements-borderColor p-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-bolt-elements-textPrimary">{model ? '編輯模型' : '添加新模型'}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bolt-elements-background-depth-2 transition-colors"
          >
            <div className="i-ph:x text-xl text-bolt-elements-textSecondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 模型名稱 */}
            <div>
              <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-1">
                模型名稱 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="gpt-4o, claude-3-opus..."
                className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-accent-500"
                required
              />
              <p className="text-xs text-bolt-elements-textTertiary mt-1">用於 API 調用的模型標識符</p>
            </div>

            {/* 顯示名稱 */}
            <div>
              <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-1">
                顯示名稱 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="GPT-4o, Claude 3 Opus..."
                className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-accent-500"
                required
              />
            </div>
          </div>

          {/* 提供商 */}
          <div>
            <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-1">
              提供商 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-accent-500"
              required
            >
              <option value="AzureOpenAI">Azure OpenAI</option>
              <option value="OpenAI">OpenAI</option>
              <option value="Anthropic">Anthropic</option>
              <option value="Google">Google</option>
              <option value="Groq">Groq</option>
              <option value="OpenRouter">OpenRouter</option>
              <option value="Ollama">Ollama</option>
              <option value="OpenAILike">OpenAI-Like</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 最大輸入 Token */}
            <div>
              <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-1">
                最大輸入 Token <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.maxTokenAllowed}
                onChange={(e) => setFormData({ ...formData, maxTokenAllowed: parseInt(e.target.value) })}
                min="1000"
                max="2000000"
                className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-accent-500"
                required
              />
            </div>

            {/* 最大輸出 Token */}
            <div>
              <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-1">最大輸出 Token</label>
              <input
                type="number"
                value={formData.maxCompletionTokens || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value ? parseInt(value) : undefined;
                  setFormData({
                    ...formData,
                    maxCompletionTokens: numValue && !isNaN(numValue) ? numValue : undefined,
                  });
                }}
                min="100"
                max="200000"
                className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-1">描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="模型的簡短描述..."
              className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>

          {/* 功能選項 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="w-4 h-4 rounded border-bolt-elements-borderColor text-accent-500 focus:ring-2 focus:ring-accent-500"
              />
              <span className="text-sm text-bolt-elements-textPrimary">啟用此模型</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isReasoning}
                onChange={(e) => setFormData({ ...formData, isReasoning: e.target.checked })}
                className="w-4 h-4 rounded border-bolt-elements-borderColor text-accent-500 focus:ring-2 focus:ring-accent-500"
              />
              <span className="text-sm text-bolt-elements-textPrimary">推理模型（Reasoning Model）</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.supportsTools}
                onChange={(e) => setFormData({ ...formData, supportsTools: e.target.checked })}
                className="w-4 h-4 rounded border-bolt-elements-borderColor text-accent-500 focus:ring-2 focus:ring-accent-500"
              />
              <span className="text-sm text-bolt-elements-textPrimary">支援工具調用（Function Calling）</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.supportsImages}
                onChange={(e) => setFormData({ ...formData, supportsImages: e.target.checked })}
                className="w-4 h-4 rounded border-bolt-elements-borderColor text-accent-500 focus:ring-2 focus:ring-accent-500"
              />
              <span className="text-sm text-bolt-elements-textPrimary">支援圖像輸入（Vision）</span>
            </label>
          </div>

          {/* 操作按鈕 */}
          <div className="flex gap-3 pt-4 border-t border-bolt-elements-borderColor">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary rounded-lg hover:bg-bolt-elements-background-depth-3 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
            >
              {model ? '更新' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
