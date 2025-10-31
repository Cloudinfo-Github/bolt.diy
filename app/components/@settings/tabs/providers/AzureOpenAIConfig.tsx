import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';
import { FaSave, FaSync, FaCheckCircle, FaExclamationCircle, FaCloud } from 'react-icons/fa';
import Cookies from 'js-cookie';
import { getApiKeysFromCookies } from '~/components/chat/APIKeyManager';

interface AzureOpenAIConfigProps {
  onSave?: (config: AzureConfig) => void;
}

interface AzureConfig {
  api_key: string;
  endpoint: string;
  resource_name?: string;
  deployment_name?: string;
  api_version?: string;
}

export const AzureOpenAiConfig: React.FC<AzureOpenAIConfigProps> = ({ onSave }) => {
  const [config, setConfig] = useState<AzureConfig>({
    api_key: '',
    endpoint: '',
    resource_name: '',
    deployment_name: '',
    api_version: '2025-04-01-preview',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isEnvConfigured, setIsEnvConfigured] = useState(false);

  // Load saved configuration from cookies on mount
  useEffect(() => {
    loadSavedConfig();
    checkEnvConfiguration();
  }, []);

  const loadSavedConfig = () => {
    try {
      // Load API key from cookies
      const savedKeys = getApiKeysFromCookies();
      const savedApiKey = savedKeys.AzureOpenAI || '';

      // Load other config from localStorage
      const savedConfig = localStorage.getItem('azure_openai_config');

      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setConfig({
          api_key: savedApiKey,
          endpoint: parsed.endpoint || '',
          resource_name: parsed.resource_name || '',
          deployment_name: parsed.deployment_name || '',
          api_version: parsed.api_version || '2025-04-01-preview',
        });
      } else {
        setConfig((prev) => ({ ...prev, api_key: savedApiKey }));
      }
    } catch (error) {
      console.error('Error loading saved configuration:', error);
    }
  };

  const checkEnvConfiguration = async () => {
    try {
      const response = await fetch('/api/save-env-config?provider=azure_openai');
      const data = (await response.json()) as { config?: Record<string, string> };

      if (data.config && Object.keys(data.config).length > 0) {
        setIsEnvConfigured(true);
      }
    } catch (error) {
      console.error('Error checking environment configuration:', error);
    }
  };

  const handleChange = (field: keyof AzureConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveToCookies = () => {
    setIsSaving(true);

    try {
      // Save API key to cookies
      const currentKeys = getApiKeysFromCookies();
      const newKeys = { ...currentKeys, AzureOpenAI: config.api_key };
      Cookies.set('apiKeys', JSON.stringify(newKeys));

      // Save other config to localStorage
      const configToSave = {
        endpoint: config.endpoint,
        resource_name: config.resource_name,
        deployment_name: config.deployment_name,
        api_version: config.api_version,
      };
      localStorage.setItem('azure_openai_config', JSON.stringify(configToSave));

      toast.success('Azure OpenAI 配置已儲存到瀏覽器');
      onSave?.(config);
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('儲存配置失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncToEnv = async () => {
    // Validate required fields
    if (!config.api_key || !config.endpoint) {
      toast.error('請至少填寫 API Key 和 Endpoint');
      return;
    }

    setIsSyncing(true);

    try {
      const response = await fetch('/api/save-env-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'azure_openai',
          config,
        }),
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (response.ok) {
        toast.success('✅ 配置已同步到 .env.local！\n請重新啟動開發伺服器以套用變更。', {
          autoClose: 5000,
        });
        setIsEnvConfigured(true);

        // Also save to cookies
        handleSaveToCookies();
      } else {
        throw new Error(data.message || data.error);
      }
    } catch (error: any) {
      console.error('Error syncing to .env.local:', error);
      toast.error(`同步失敗：${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <motion.div
      className="space-y-6 p-6 bg-bolt-elements-background-depth-2 rounded-lg border border-bolt-elements-borderColor"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-500/10">
          <FaCloud className="w-6 h-6 text-blue-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-bolt-elements-textPrimary">Azure OpenAI 配置</h3>
          <p className="text-sm text-bolt-elements-textSecondary">配置 Azure OpenAI Service 連線資訊</p>
        </div>
        {isEnvConfigured && (
          <div className="flex items-center gap-2 text-green-500 text-sm">
            <FaCheckCircle />
            <span>.env.local 已配置</span>
          </div>
        )}
      </div>

      {/* Configuration Fields */}
      <div className="space-y-4">
        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
            API Key <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={config.api_key}
            onChange={(e) => handleChange('api_key', e.target.value)}
            placeholder="輸入您的 Azure OpenAI API Key"
            className={classNames(
              'w-full px-4 py-2 rounded-lg border',
              'bg-bolt-elements-background text-bolt-elements-textPrimary',
              'border-bolt-elements-borderColor',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              'placeholder:text-bolt-elements-textTertiary',
            )}
          />
          <p className="text-xs text-bolt-elements-textSecondary mt-1">
            從{' '}
            <a
              href="https://portal.azure.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Azure Portal
            </a>{' '}
            取得
          </p>
        </div>

        {/* Endpoint */}
        <div>
          <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
            Endpoint URL <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={config.endpoint}
            onChange={(e) => handleChange('endpoint', e.target.value)}
            placeholder="https://your-resource.services.ai.azure.com"
            className={classNames(
              'w-full px-4 py-2 rounded-lg border',
              'bg-bolt-elements-background text-bolt-elements-textPrimary',
              'border-bolt-elements-borderColor',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              'placeholder:text-bolt-elements-textTertiary',
            )}
          />
          <div className="mt-2 space-y-2">
            <p className="text-xs text-bolt-elements-textSecondary">
              <strong>支援兩種端點類型：</strong>
            </p>
            <div className="bg-green-500/10 border border-green-500/20 rounded p-2">
              <p className="text-xs text-green-600 font-semibold mb-1">
                ✨ 推薦：Azure AI Foundry v1 API（一次配置，所有模型可用）
              </p>
              <code className="text-xs bg-bolt-elements-background-depth-3 px-2 py-1 rounded block">
                https://your-resource.services.ai.azure.com/openai/v1/
              </code>
              <p className="text-xs text-green-600 mt-1">支援 GPT-5, GPT-4o, DeepSeek 等所有模型，無需部署配置</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2">
              <p className="text-xs text-blue-600 font-semibold mb-1">傳統 Azure OpenAI（需要為每個模型創建部署）</p>
              <code className="text-xs bg-bolt-elements-background-depth-3 px-2 py-1 rounded block">
                https://your-resource.openai.azure.com
              </code>
              <p className="text-xs text-blue-600 mt-1">需要填寫 Deployment Name</p>
            </div>
          </div>
        </div>

        {/* Optional Fields */}
        <div className="pt-2 border-t border-bolt-elements-borderColor">
          <p className="text-sm font-medium text-bolt-elements-textPrimary mb-3">可選配置</p>

          {/* Resource Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-2">Resource Name</label>
            <input
              type="text"
              value={config.resource_name}
              onChange={(e) => handleChange('resource_name', e.target.value)}
              placeholder="your-resource-name"
              className={classNames(
                'w-full px-4 py-2 rounded-lg border',
                'bg-bolt-elements-background text-bolt-elements-textPrimary',
                'border-bolt-elements-borderColor',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                'placeholder:text-bolt-elements-textTertiary',
              )}
            />
            <p className="text-xs text-bolt-elements-textSecondary mt-1">替代 endpoint URL 使用（選填）</p>
          </div>

          {/* Deployment Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-2">
              Deployment Name
              {config.endpoint && config.endpoint.includes('.openai.azure.com') && (
                <span className="text-red-500 ml-1">*（必填）</span>
              )}
            </label>
            <input
              type="text"
              value={config.deployment_name}
              onChange={(e) => handleChange('deployment_name', e.target.value)}
              placeholder="gpt-4o-deployment"
              className={classNames(
                'w-full px-4 py-2 rounded-lg border',
                'bg-bolt-elements-background text-bolt-elements-textPrimary',
                config.endpoint && config.endpoint.includes('.openai.azure.com') && !config.deployment_name
                  ? 'border-red-500'
                  : 'border-bolt-elements-borderColor',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                'placeholder:text-bolt-elements-textTertiary',
              )}
            />
            <div className="mt-1 space-y-1">
              <p className="text-xs text-bolt-elements-textSecondary">
                在{' '}
                <a
                  href="https://portal.azure.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Azure Portal
                </a>{' '}
                的 Model deployments 頁面找到
              </p>
              {config.endpoint && config.endpoint.includes('.openai.azure.com') && (
                <p className="text-xs text-yellow-500 font-medium">
                  ⚠️ 傳統 Azure OpenAI 端點需要填寫 Deployment Name（不是模型名稱）
                </p>
              )}
              {config.endpoint && config.endpoint.includes('.services.ai.azure.com') && (
                <p className="text-xs text-green-500">ℹ️ Azure AI Foundry 端點可以留空，將使用模型名稱</p>
              )}
            </div>
          </div>

          {/* API Version */}
          <div>
            <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-2">API Version</label>
            <input
              type="text"
              value={config.api_version}
              onChange={(e) => handleChange('api_version', e.target.value)}
              placeholder="2025-04-01-preview"
              className={classNames(
                'w-full px-4 py-2 rounded-lg border',
                'bg-bolt-elements-background text-bolt-elements-textPrimary',
                'border-bolt-elements-borderColor',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                'placeholder:text-bolt-elements-textTertiary',
              )}
            />
            <p className="text-xs text-bolt-elements-textSecondary mt-1">
              Azure OpenAI API 版本（預設：2025-04-01-preview）
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-bolt-elements-borderColor">
        <motion.button
          onClick={handleSaveToCookies}
          disabled={isSaving}
          className={classNames(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg',
            'bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text',
            'hover:bg-bolt-elements-button-primary-backgroundHover',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-200',
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FaSave />
          {isSaving ? '儲存中...' : '儲存到瀏覽器'}
        </motion.button>

        <motion.button
          onClick={handleSyncToEnv}
          disabled={isSyncing || !config.api_key || !config.endpoint}
          className={classNames(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg',
            'bg-blue-500 text-white',
            'hover:bg-blue-600',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-200',
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FaSync className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? '同步中...' : '同步到 .env.local'}
        </motion.button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FaExclamationCircle className="text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-bolt-elements-textPrimary space-y-2">
            <p className="font-medium">配置說明：</p>
            <ul className="list-disc list-inside space-y-1 text-bolt-elements-textSecondary">
              <li>「儲存到瀏覽器」：配置儲存在瀏覽器 Cookies 和 LocalStorage 中</li>
              <li>「同步到 .env.local」：配置寫入專案的 .env.local 檔案（永久保存）</li>
              <li>同步後需要重新啟動開發伺服器（pnpm run dev）才能生效</li>
              <li>如果已在 .env.local 中配置，系統會自動使用該配置</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
