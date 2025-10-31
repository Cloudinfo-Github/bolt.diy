import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createAzure } from '@ai-sdk/azure';
import { createOpenAI } from '@ai-sdk/openai';

export default class AzureOpenAIProvider extends BaseProvider {
  name = 'AzureOpenAI';
  getApiKeyLink = 'https://portal.azure.com/#view/Microsoft_Azure_ProjectOxford/CognitiveServicesHub/~/OpenAI';

  config = {
    apiTokenKey: 'AZURE_OPENAI_API_KEY',
    baseUrlKey: 'AZURE_OPENAI_ENDPOINT',
  };

  staticModels: ModelInfo[] = [
    // GPT-5 Series (Latest - 2025)
    {
      name: 'gpt-5',
      label: 'GPT-5',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 400000,
      maxCompletionTokens: 128000,
    },
    {
      name: 'gpt-5-mini',
      label: 'GPT-5 Mini',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 400000,
      maxCompletionTokens: 128000,
    },
    {
      name: 'gpt-5-nano',
      label: 'GPT-5 Nano',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 400000,
      maxCompletionTokens: 128000,
    },
    {
      name: 'gpt-5-chat',
      label: 'GPT-5 Chat',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 16384,
    },
    {
      name: 'gpt-5-codex',
      label: 'GPT-5 Codex',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 400000,
      maxCompletionTokens: 128000,
    },
    {
      name: 'gpt-5-pro',
      label: 'GPT-5 Pro',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 400000,
      maxCompletionTokens: 128000,
    },

    // GPT-4.1 Series
    {
      name: 'gpt-4.1',
      label: 'GPT-4.1',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 1047576,
      maxCompletionTokens: 32768,
    },
    {
      name: 'gpt-4.1-mini',
      label: 'GPT-4.1 Mini',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 1047576,
      maxCompletionTokens: 32768,
    },
    {
      name: 'gpt-4.1-nano',
      label: 'GPT-4.1 Nano',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 1047576,
      maxCompletionTokens: 32768,
    },

    // GPT-4o Series (Recommended for production)
    {
      name: 'gpt-4o',
      label: 'GPT-4o (2024-11-20)',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 16384,
    },
    {
      name: 'gpt-4o-2024-08-06',
      label: 'GPT-4o (2024-08-06)',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 16384,
    },
    {
      name: 'gpt-4o-2024-05-13',
      label: 'GPT-4o (2024-05-13)',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 4096,
    },
    {
      name: 'gpt-4o-mini',
      label: 'GPT-4o Mini',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 16384,
    },

    // O-Series Reasoning Models
    {
      name: 'o3',
      label: 'O3',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 200000,
      maxCompletionTokens: 100000,
    },
    {
      name: 'o4-mini',
      label: 'O4 Mini',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 200000,
      maxCompletionTokens: 100000,
    },
    {
      name: 'o3-mini',
      label: 'O3 Mini',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 200000,
      maxCompletionTokens: 100000,
    },
    {
      name: 'o1',
      label: 'O1',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 200000,
      maxCompletionTokens: 100000,
    },
    {
      name: 'o1-mini',
      label: 'O1 Mini',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 65536,
    },

    // GPT-4 Turbo
    {
      name: 'gpt-4',
      label: 'GPT-4 Turbo',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 4096,
    },

    // GPT-3.5 Series
    {
      name: 'gpt-35-turbo',
      label: 'GPT-3.5 Turbo',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 16385,
      maxCompletionTokens: 4096,
    },
    {
      name: 'gpt-35-turbo-instruct',
      label: 'GPT-3.5 Turbo Instruct',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 4097,
      maxCompletionTokens: 4096,
    },
  ];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    try {
      const { apiKey, baseUrl } = this.getProviderBaseUrlAndKey({
        apiKeys,
        providerSettings: settings,
        serverEnv: serverEnv as any,
        defaultBaseUrlKey: 'AZURE_OPENAI_ENDPOINT',
        defaultApiTokenKey: 'AZURE_OPENAI_API_KEY',
      });

      if (!apiKey || !baseUrl) {
        return [];
      }

      /*
       * Azure OpenAI doesn't have a models listing endpoint like OpenAI
       * Users should create deployments in Azure Portal and use deployment names
       * Return empty array as dynamic models are deployment-specific
       */
      return [];
    } catch (error) {
      console.error('Error fetching Azure OpenAI models:', error);
      return [];
    }
  }

  /**
   * 檢測端點類型
   * Azure AI Foundry: https://{resource}.services.ai.azure.com
   * Azure OpenAI: https://{resource}.openai.azure.com
   */
  private _isAzureAIFoundry(endpoint: string): boolean {
    return (
      endpoint.includes('.services.ai.azure.com') || endpoint.includes('/openai/v1') || endpoint.includes('/models')
    );
  }

  /**
   * 檢測模型是否需要使用 Responses API
   * gpt-5-codex 僅支援 Responses API，不支援 Chat Completions API
   */
  private _requiresResponsesAPI(model: string): boolean {
    const responsesOnlyModels = [
      'gpt-5-codex',

      // 可以在這裡添加其他只支援 Responses API 的模型
    ];
    return responsesOnlyModels.includes(model);
  }

  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { apiKey, baseUrl } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: 'AZURE_OPENAI_ENDPOINT',
      defaultApiTokenKey: 'AZURE_OPENAI_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    // Get additional Azure-specific settings
    const resourceName = serverEnv?.AZURE_OPENAI_RESOURCE_NAME || process?.env?.AZURE_OPENAI_RESOURCE_NAME;
    const apiVersion =
      serverEnv?.AZURE_OPENAI_API_VERSION || process?.env?.AZURE_OPENAI_API_VERSION || '2025-04-01-preview';

    const deploymentName =
      serverEnv?.AZURE_OPENAI_DEPLOYMENT_NAME || process?.env?.AZURE_OPENAI_DEPLOYMENT_NAME || model;

    // 檢測是否為 Azure AI Foundry 端點
    if (baseUrl && this._isAzureAIFoundry(baseUrl)) {
      const requiresResponsesAPI = this._requiresResponsesAPI(model);

      console.log('[AzureOpenAI] ====== Detected Azure AI Foundry endpoint ======');
      console.log('[AzureOpenAI] Base URL:', baseUrl);
      console.log('[AzureOpenAI] Model:', model);
      console.log('[AzureOpenAI] Requires Responses API:', requiresResponsesAPI);

      /*
       * Azure AI Foundry v1 API: https://xxx.services.ai.azure.com/openai/v1/
       * 使用標準 OpenAI SDK，完全兼容 OpenAI API
       */
      const openai = createOpenAI({
        apiKey,
        baseURL: baseUrl, // 直接使用完整的 base URL（包含 /openai/v1/）
        headers: {
          'api-key': apiKey, // Azure AI Foundry 使用 api-key header
        },
        fetch: (url, init) => {
          console.log('[AzureOpenAI] ====== Making Request ======');
          console.log('[AzureOpenAI] URL:', url);
          console.log('[AzureOpenAI] Model:', model);

          return fetch(url, init);
        },
      });

      // 根據模型選擇使用 Responses API 或 Chat Completions API
      if (requiresResponsesAPI) {
        console.log('[AzureOpenAI] Using Responses API for', model);
        return openai.responses(model) as unknown as LanguageModelV1;
      } else {
        console.log('[AzureOpenAI] Using Chat Completions API for', model);
        return openai(model) as unknown as LanguageModelV1;
      }
    } else {
      console.log('[AzureOpenAI] Using traditional Azure OpenAI endpoint');

      // 傳統 Azure OpenAI 配置
      const azure = createAzure({
        apiKey,

        // Use baseURL if provided (endpoint), otherwise use resourceName
        ...(baseUrl ? { baseURL: baseUrl } : { resourceName }),
        apiVersion,
      });

      // Return model instance using deployment name
      return azure(deploymentName) as unknown as LanguageModelV1;
    }
  }
}
