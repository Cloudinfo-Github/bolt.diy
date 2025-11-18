import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createAzure } from '@ai-sdk/azure';
import { createOpenAI } from '@ai-sdk/openai';

/*
 * 🔥 全局 Map 用於在 fetch wrapper 和 onFinish 之間共享推理摘要
 * Key: responseId (從 Azure response 中的 x-request-id 或生成的 UUID)
 * Value: { summary: string, encrypted: string }
 */
const reasoningSummaryStore = new Map<string, { summary?: string; encrypted?: string }>();

// 清理舊條目（防止記憶體洩漏）- 保留最近 100 個
function cleanupOldReasoningSummaries() {
  if (reasoningSummaryStore.size > 100) {
    const entries = Array.from(reasoningSummaryStore.entries());

    // 刪除最舊的 50 個
    entries.slice(0, 50).forEach(([key]) => reasoningSummaryStore.delete(key));
  }
}

// 導出供 api.chat.ts 使用
export function getReasoningSummary(requestId: string) {
  const data = reasoningSummaryStore.get(requestId);

  if (data) {
    // 讀取後立即清理以節省記憶體
    reasoningSummaryStore.delete(requestId);
  }

  return data;
}

export default class AzureOpenAIProvider extends BaseProvider {
  name = 'AzureOpenAI';
  getApiKeyLink = 'https://portal.azure.com/#view/Microsoft_Azure_ProjectOxford/CognitiveServicesHub/~/OpenAI';

  config = {
    apiTokenKey: 'AZURE_OPENAI_API_KEY',
    baseUrlKey: 'AZURE_OPENAI_ENDPOINT',
  };

  staticModels: ModelInfo[] = [
    /*
     * ✅ Azure AI Foundry 實際部署的模型
     * 最後更新：2025-11-13
     * 說明：只包含用戶實際部署在 Azure AI Foundry 專案中的 11 個模型
     */

    // ==================== DeepSeek 系列 ====================
    {
      name: 'DeepSeek-R1',
      label: 'DeepSeek-R1 🔥',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 8192,
    },
    {
      name: 'DeepSeek-R1-0528',
      label: 'DeepSeek-R1-0528 🔥⚡',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 8192,
    },

    // ==================== GPT-4.1 ====================
    {
      name: 'gpt-4.1',
      label: 'GPT-4.1',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 1048576,
      maxCompletionTokens: 32768,
    },

    // ==================== GPT-4o 系列 ====================
    {
      name: 'gpt-4o-realtime-preview',
      label: 'GPT-4o Realtime Preview',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 16384,
    },

    // ==================== GPT-5 系列 ====================
    {
      name: 'gpt-5',
      label: 'GPT-5',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 400000,
      maxCompletionTokens: 128000,
    },
    {
      name: 'gpt-5-codex',
      label: 'GPT-5 Codex',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 400000,
      maxCompletionTokens: 128000,
    },

    // ==================== 圖像生成模型 ====================
    {
      name: 'gpt-image-1',
      label: 'GPT Image 1',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 4096,
    },

    // ==================== Grok 系列 (xAI) ====================
    {
      name: 'grok-4-fast-reasoning',
      label: 'Grok-4 Fast Reasoning 🧠',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 4096, // 降低以符合 Azure S0 tier 的 50K tokens/min 限制
    },

    // ==================== O3 系列 (推理模型) ====================
    {
      name: 'o3-mini',
      label: 'O3 Mini',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 65000,
    },

    // ==================== Sora 系列 (視頻生成) ====================
    {
      name: 'sora',
      label: 'Sora',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 4096,
    },
    {
      name: 'sora-2',
      label: 'Sora 2',
      provider: 'AzureOpenAI',
      maxTokenAllowed: 128000,
      maxCompletionTokens: 4096,
    },
  ];

  async getDynamicModels(
    _apiKeys?: Record<string, string>,
    _settings?: IProviderSetting,
    _serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    /*
     * 🔍 Azure AI Foundry 動態模型獲取功能已禁用
     *
     * 原因：
     * 1. 專案特定的部署 API (/api/projects/_project/deployments) 需要 OAuth2 認證，API Key 無法使用
     * 2. 全局模型 API (/openai/models) 會返回所有 237 個可用模型，而不是專案實際部署的模型
     * 3. 這是 bolt.diy 社群的主流做法 - 使用靜態模型列表
     *
     * 解決方案：
     * 請在上方的 staticModels 陣列中維護實際部署的模型列表
     * 當您在 Azure AI Foundry 中添加或刪除部署時，請手動更新 staticModels 陣列
     */
    console.log('[AzureOpenAI] 使用靜態模型列表（動態獲取已禁用）');
    return [];
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
      const defaultMaxCompletionTokens = this.staticModels.find((m) => m.name === model)?.maxCompletionTokens ?? 8192;

      // Normalize base URL: ensure it ends with /v1
      let normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, ''); // Remove trailing slashes

      if (!normalizedBaseUrl.endsWith('/v1')) {
        normalizedBaseUrl = `${normalizedBaseUrl}/v1`;
      }

      console.log('[AzureOpenAI] ====== Detected Azure AI Foundry endpoint ======');
      console.log('[AzureOpenAI] Original Base URL:', baseUrl);
      console.log('[AzureOpenAI] Normalized Base URL:', normalizedBaseUrl);
      console.log('[AzureOpenAI] Model:', model);
      console.log('[AzureOpenAI] Requires Responses API:', requiresResponsesAPI);
      console.log('[AzureOpenAI] Default max_completion_tokens:', defaultMaxCompletionTokens);

      /*
       * Azure AI Foundry v1 API: https://xxx.services.ai.azure.com/openai/v1/
       * 使用標準 OpenAI SDK，完全兼容 OpenAI API
       */

      const openai = createOpenAI({
        apiKey,
        baseURL: normalizedBaseUrl, // 使用規範化後的 base URL（包含 /v1）
        headers: {
          'api-key': apiKey, // Azure AI Foundry 使用 api-key header
        },
        fetch: (url, init) => {
          console.log('[AzureOpenAI] ====== Making Request ======');
          console.log('[AzureOpenAI] URL:', url);
          console.log('[AzureOpenAI] Model:', model);
          console.log('[AzureOpenAI] requiresResponsesAPI:', requiresResponsesAPI);

          // Azure Responses API 參數轉換
          if (requiresResponsesAPI && init?.body) {
            try {
              const body = JSON.parse(init.body as string);

              // 🔍 DEBUG: 記錄原始請求體
              console.log('[AzureOpenAI] [原始請求] 請求體鍵:', Object.keys(body));
              console.log('[AzureOpenAI] [原始請求] reasoning:', JSON.stringify(body.reasoning));
              console.log('[AzureOpenAI] [原始請求] include:', JSON.stringify(body.include));

              // Azure Responses API 使用 max_output_tokens 而非 max_completion_tokens
              if (body.max_completion_tokens) {
                console.log('[AzureOpenAI] Converting max_completion_tokens to max_output_tokens for Responses API');
                body.max_output_tokens = body.max_completion_tokens;
                delete body.max_completion_tokens;
              }

              /*
               * CRITICAL FIX: Vercel AI SDK 的 openai.responses() 沒有正確傳遞 maxCompletionTokens
               * 我們需要從 URL 參數或使用預設值手動添加 max_output_tokens
               */
              if (!body.max_output_tokens) {
                console.log(
                  `[AzureOpenAI] ⚠️ AI SDK 未傳遞 max_output_tokens，手動添加預設值: ${defaultMaxCompletionTokens}`,
                );
                body.max_output_tokens = defaultMaxCompletionTokens;
              }

              // 🔥 關鍵修復：添加 reasoning summary 參數
              if (!body.reasoning || typeof body.reasoning !== 'object') {
                console.log('[AzureOpenAI] [修復] 創建新的 reasoning 物件');
                body.reasoning = {};
              } else {
                console.log('[AzureOpenAI] [檢測] reasoning 物件已存在');
              }

              // 設置 reasoning summary 為 auto 模式（可選值：'auto' | 'detailed'）
              if (!body.reasoning.summary) {
                console.log('[AzureOpenAI] [設置] reasoning.summary = "auto"');
                body.reasoning.summary = 'auto';
              } else {
                console.log(`[AzureOpenAI] [資訊] reasoning.summary 已存在: "${body.reasoning.summary}"，保持不變`);
              }

              /*
               * 🔥 依照官方建議，Responses API 需要透過 include 指定 output item
               * 這裡強制加入 reasoning / reasoning_summary / output_text，以確保可取得摘要與加密內容
               */

              const requiredIncludes = ['reasoning', 'reasoning_summary', 'output_text'];

              if (!Array.isArray(body.include)) {
                body.include = [];
              }

              for (const item of requiredIncludes) {
                if (!body.include.includes(item)) {
                  body.include.push(item);
                }
              }

              console.log('[AzureOpenAI] [設置] include:', JSON.stringify(body.include));

              // 更新 init.body（直接修改屬性而不是重新賦值）
              init.body = JSON.stringify(body);

              // 🔍 DEBUG: 記錄最終請求體
              console.log('[AzureOpenAI] [最終請求] 請求體鍵:', Object.keys(body));
              console.log('[AzureOpenAI] [最終請求] reasoning:', JSON.stringify(body.reasoning));
              console.log('[AzureOpenAI] [最終請求] include:', JSON.stringify(body.include));
              console.log('[AzureOpenAI] [最終請求] Has tools:', !!body.tools);
              console.log('[AzureOpenAI] [最終請求] Has tool_choice:', !!body.tool_choice);
              console.log('[AzureOpenAI] [最終請求] Has max_output_tokens:', !!body.max_output_tokens);
              console.log('[AzureOpenAI] [最終請求] max_output_tokens value:', body.max_output_tokens);
            } catch (error) {
              console.log('[AzureOpenAI] ❌ 無法解析請求體:', error);
            }
          } else if (init?.body) {
            try {
              const body = JSON.parse(init.body as string);
              console.log('[AzureOpenAI] Request body keys:', Object.keys(body));
              console.log('[AzureOpenAI] Has tools:', !!body.tools);
              console.log('[AzureOpenAI] Has tool_choice:', !!body.tool_choice);

              /*
               * 🔥 關鍵修復：為 Chat Completions API 的 reasoning models 添加 stream: true
               * AI SDK 的 generateText 不會自動添加，但 xAI 的 reasoning models 需要 streaming
               */
              if (!body.stream) {
                console.log('[AzureOpenAI] ⚠️ Adding stream: true for Chat Completions API');
                body.stream = true;
                init.body = JSON.stringify(body);
              }

              if (!body.max_tokens && !body.max_completion_tokens) {
                // 🔥 確保 max_completion_tokens 存在（如果是 reasoning model）
                console.log(`[AzureOpenAI] ⚠️ Adding default max_completion_tokens: ${defaultMaxCompletionTokens}`);
                body.max_completion_tokens = defaultMaxCompletionTokens;
                init.body = JSON.stringify(body);
              }
            } catch {
              console.log('[AzureOpenAI] Could not parse body for logging');
            }
          }

          console.log('[AzureOpenAI] Calling fetch...');

          /*
           * 為 Azure Responses API 設定更長的超時時間
           * Responses API 在生成大型專案時需要較長的思考時間
           */
          const fetchPromise = fetch(url, {
            ...init,

            // @ts-ignore - undici specific options for Node.js fetch
            bodyTimeout: 300000, // 5 minutes - wait for response body chunks
            headersTimeout: 60000, // 1 minute - wait for initial headers
          });

          // 添加超時保護
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error('[AzureOpenAI] Fetch timeout after 60 seconds - no response received'));
            }, 60000);
          });

          return Promise.race([fetchPromise, timeoutPromise])
            .then(async (response: any) => {
              console.log('[AzureOpenAI] ✅ Received response!');
              console.log('[AzureOpenAI] Status:', response.status, response.statusText);

              // 記錄所有 response headers
              console.log('[AzureOpenAI] [回應 Headers]:');
              response.headers.forEach((value: string, key: string) => {
                console.log(`  ${key}: ${value}`);
              });

              /*
               * 🔥 關鍵修復：為 Chat Completions API 也提取 reasoning content
               * 但使用不同的方式：從 streaming chunks 的 reasoning_content 欄位提取
               */
              if (!requiresResponsesAPI) {
                console.log(
                  '[AzureOpenAI] ✅ Using Chat Completions API - will extract reasoning from streaming chunks',
                );

                if (!response.body) {
                  console.log('[AzureOpenAI] ⚠️ Response has no body');
                  return response;
                }

                const [captureStream, clientStream] = response.body.tee();
                const newHeaders = new Headers(response.headers);
                const requestId =
                  response.headers.get('x-request-id') ||
                  response.headers.get('x-ms-request-id') ||
                  response.headers.get('apim-request-id') ||
                  crypto.randomUUID();

                newHeaders.set('x-reasoning-request-id', requestId);

                void (async () => {
                  let reasoningContent = '';

                  try {
                    const reader = captureStream.getReader();
                    const decoder = new TextDecoder();
                    let buffer = '';
                    let chunkCount = 0;

                    while (chunkCount < 200) {
                      const { done, value } = await reader.read();

                      if (done) {
                        console.log('[AzureOpenAI] 🔍 Chat completion stream reader done');
                        break;
                      }

                      const chunkText = decoder.decode(value, { stream: true });
                      buffer += chunkText;
                      chunkCount++;

                      const lines = buffer.split('\n');
                      const incompleteLine = lines.pop() || '';
                      buffer = incompleteLine;

                      for (const line of lines) {
                        if (!line.trim() || line.startsWith(':')) {
                          continue;
                        }

                        if (line.startsWith('data: ')) {
                          const dataContent = line.substring(6).trim();

                          if (dataContent === '[DONE]') {
                            continue;
                          }

                          try {
                            const data = JSON.parse(dataContent);

                            if (data.choices && data.choices[0]?.delta?.reasoning_content) {
                              reasoningContent += data.choices[0].delta.reasoning_content;

                              if (reasoningContent.length % 500 === 0) {
                                console.log(
                                  `[AzureOpenAI] 📝 Extracting reasoning_content, length: ${reasoningContent.length}`,
                                );
                              }
                            }
                          } catch (parseError) {
                            console.log('[AzureOpenAI] ⚠️ Failed to parse SSE chunk for reasoning:', parseError);
                          }
                        }
                      }

                      if (reasoningContent.length > 4000) {
                        console.log('[AzureOpenAI] ✅ Collected sufficient reasoning content (Chat Completions)');
                        break;
                      }
                    }

                    if (reasoningContent) {
                      reasoningSummaryStore.set(requestId, {
                        summary: reasoningContent,
                        encrypted: undefined,
                      });

                      cleanupOldReasoningSummaries();

                      console.log('[AzureOpenAI] ✅ Stored reasoning summary for Chat Completions');
                    } else {
                      console.log('[AzureOpenAI] ⚠️ No reasoning_content found in streaming response');
                    }
                  } catch (error) {
                    console.error('[AzureOpenAI] ❌ Error extracting reasoning from Chat Completions API:', error);
                  }
                })();

                return new Response(clientStream, {
                  status: response.status,
                  statusText: response.statusText,
                  headers: newHeaders,
                });
              }

              // 以下是 Responses API 的推理提取邏輯

              // 對於非串流回應（如 llmcall），繼續使用同步 JSON 解析
              const contentType = response.headers.get('content-type') || '';
              const isStreamResponse = contentType.includes('text/event-stream');

              if (!isStreamResponse) {
                console.log('[AzureOpenAI] 🔍 Non-streaming response detected, skipping SSE parsing');
                return response;
              }

              if (!response.body) {
                console.log('[AzureOpenAI] ⚠️ Response has no body');
                return response;
              }

              const [captureStream, clientStream] = response.body.tee();
              const newHeaders = new Headers(response.headers);
              const requestId =
                response.headers.get('x-request-id') ||
                response.headers.get('x-ms-request-id') ||
                response.headers.get('apim-request-id') ||
                crypto.randomUUID();

              newHeaders.set('x-reasoning-request-id', requestId);

              void (async () => {
                try {
                  let reasoningSummary: string | undefined;
                  let reasoningEncrypted: string | undefined;

                  console.log('[AzureOpenAI] 🔍 開始讀取 SSE 流以提取 reasoning...');

                  const reader = captureStream.getReader();
                  const decoder = new TextDecoder();
                  let buffer = '';
                  let chunkCount = 0;
                  let reasoningSummaryAccumulator = '';
                  let isAccumulatingReasoning = false;

                  while (chunkCount < 200 && buffer.length < 400000) {
                    const { done, value } = await reader.read();

                    if (done) {
                      console.log('[AzureOpenAI] 🔍 SSE reader 完成');
                      break;
                    }

                    const chunkText = decoder.decode(value, { stream: true });
                    buffer += chunkText;
                    chunkCount++;

                    if (chunkCount % 10 === 0) {
                      console.log(
                        `[AzureOpenAI] 🔍 Chunk ${chunkCount}: 長度=${chunkText.length}, Buffer總長度=${buffer.length}`,
                      );
                    }

                    const lines = buffer.split('\n');
                    const incompleteLine = lines.pop() || '';
                    buffer = incompleteLine;

                    for (const line of lines) {
                      if (!line.trim() || line.startsWith(':')) {
                        continue;
                      }

                      if (line.startsWith('data: ')) {
                        const dataContent = line.substring(6).trim();

                        if (dataContent === '[DONE]') {
                          continue;
                        }

                        try {
                          const data = JSON.parse(dataContent);

                          if (data.type && (data.type.includes('reasoning') || data.type.includes('summary'))) {
                            console.log('[AzureOpenAI] [SSE事件] 🔥', data.type);
                          }

                          if (data.type === 'response.reasoning_summary_part.added') {
                            isAccumulatingReasoning = true;
                            reasoningSummaryAccumulator = '';
                          }

                          if (data.type === 'response.reasoning_summary_text.delta' && data.delta) {
                            if (isAccumulatingReasoning) {
                              reasoningSummaryAccumulator += data.delta;
                            }
                          }

                          if (data.type === 'response.reasoning_summary_text.done') {
                            if (isAccumulatingReasoning && reasoningSummaryAccumulator) {
                              reasoningSummary = reasoningSummaryAccumulator;
                            }

                            isAccumulatingReasoning = false;
                          }

                          if (data.type === 'response.output_item.added' && data.item) {
                            const item = data.item;

                            if (item.type === 'reasoning' && item.encrypted_content) {
                              reasoningEncrypted = item.encrypted_content;
                            }

                            if (item.type === 'summary_text' && item.text) {
                              reasoningSummary = item.text;
                            }
                          }

                          if (data.type === 'response.output_item.done' && data.item?.type === 'reasoning') {
                            if (data.item?.summary && !reasoningSummary) {
                              reasoningSummary = data.item.summary;
                            }
                          }
                        } catch (parseError) {
                          console.log('[AzureOpenAI] ⚠️ 解析 SSE 事件失敗:', parseError);
                        }
                      }
                    }

                    if (reasoningSummary && reasoningSummary.length > 1000 && chunkCount > 20) {
                      console.log('[AzureOpenAI] ✅ 收集到足夠推理摘要，提前退出');
                      break;
                    }
                  }

                  if (reasoningSummary || reasoningEncrypted) {
                    reasoningSummaryStore.set(requestId, {
                      summary: reasoningSummary,
                      encrypted: reasoningEncrypted,
                    });

                    cleanupOldReasoningSummaries();

                    console.log('[AzureOpenAI] ✅✅✅ Reasoning 資料已存儲到全局 Map (Responses API)');
                  } else {
                    console.log('[AzureOpenAI] ⚠️⚠️⚠️ 未找到 reasoning 摘要或加密內容');
                  }
                } catch (readError) {
                  console.log('[AzureOpenAI] ❌ 讀取回應內容時出錯:', readError);
                  console.log('[AzureOpenAI] ❌ 錯誤詳情:', (readError as Error).message);
                }
              })();

              return new Response(clientStream, {
                status: response.status,
                statusText: response.statusText,
                headers: newHeaders,
              });
            })
            .catch((error) => {
              console.error('[AzureOpenAI] ❌ Fetch error:', error);
              console.error('[AzureOpenAI] Error message:', error.message);
              throw error;
            });
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
