/**
 * 模型管理界面組件
 * 允許用戶添加、編輯和刪除自定義模型配置
 */

import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { customModels$, customModelsStore } from '~/lib/stores/custom-models';
import type { CustomModelConfig } from '~/types/custom-models';
import { toast } from 'react-toastify';

export function ModelManagement() {
  const models = useStore(customModels$);
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [editingModel, setEditingModel] = useState<CustomModelConfig | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('all');

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

  return (
    <div className="p-4 space-y-4">
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
