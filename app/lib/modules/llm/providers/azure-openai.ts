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
      maxCompletionTokens: 32768,
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
                // 使用 128000 作為 gpt-5-codex 的預設值（來自模型配置）
                const defaultMaxOutputTokens = 128000;
                console.log(
                  `[AzureOpenAI] ⚠️ AI SDK 未傳遞 max_output_tokens，手動添加預設值: ${defaultMaxOutputTokens}`,
                );
                body.max_output_tokens = defaultMaxOutputTokens;
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
               * 🔥 關鍵修復：不設置 include 參數，讓 Azure 返回所有預設內容
               * 包括 summary_text（摘要）和 encrypted_content（加密內容）
               * 如果我們只指定 ["reasoning.encrypted_content"]，Azure 可能只返回加密內容而不返回摘要
               */

              // 移除任何現有的 include 限制，讓 Azure 返回完整的推理數據
              if (body.include) {
                console.log('[AzureOpenAI] [移除] 刪除 include 參數以獲取完整推理數據（包括摘要）');
                delete body.include;
              } else {
                console.log('[AzureOpenAI] [確認] 未設置 include 參數，將獲取所有預設推理內容');
              }

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

          return fetchPromise
            .then(async (response) => {
              console.log('[AzureOpenAI] ✅ Received response!');
              console.log('[AzureOpenAI] Status:', response.status, response.statusText);

              // 記錄所有 response headers
              console.log('[AzureOpenAI] [回應 Headers]:');
              response.headers.forEach((value, key) => {
                console.log(`  ${key}: ${value}`);
              });

              // 對於非串流回應，嘗試讀取完整內容
              if (!response.body) {
                console.log('[AzureOpenAI] ⚠️ Response has no body');
                return response;
              }

              // 檢查響應類型
              const contentType = response.headers.get('content-type') || '';
              const isJsonResponse = contentType.includes('application/json');
              const isStreamResponse = contentType.includes('text/event-stream');

              console.log('[AzureOpenAI] 🔍 響應類型:', contentType);
              console.log('[AzureOpenAI] 🔍 是 JSON 響應:', isJsonResponse);
              console.log('[AzureOpenAI] 🔍 是流式響應:', isStreamResponse);

              // 克隆回應以便我們可以讀取它而不影響原始流
              const clonedResponse = response.clone();

              try {
                let reasoningSummary: string | undefined;
                let reasoningEncrypted: string | undefined;

                // 如果是 JSON 響應，直接解析 JSON
                if (isJsonResponse) {
                  console.log('[AzureOpenAI] 🔍 檢測到 JSON 響應，直接解析...');

                  try {
                    const jsonData = (await clonedResponse.json()) as any;
                    console.log('[AzureOpenAI] 📄 JSON 響應結構:', Object.keys(jsonData));

                    // 🔍 DEBUG: 記錄完整的 reasoning 和 output 物件
                    if (jsonData.reasoning) {
                      console.log('[AzureOpenAI] 📋 reasoning 物件:', JSON.stringify(jsonData.reasoning, null, 2));
                    }

                    if (jsonData.output) {
                      console.log('[AzureOpenAI] 📋 output 物件類型:', typeof jsonData.output);
                      console.log('[AzureOpenAI] 📋 output 物件鍵:', Object.keys(jsonData.output || {}));
                    }

                    /*
                     * 🔥 JSON 響應不提取推理摘要
                     * Azure Responses API 的 JSON 響應中，推理摘要不在 output 中，而是通過 SSE 流式傳輸
                     * JSON 響應只用於非流式調用（如 api.llmcall.ts），這類調用不需要推理摘要
                     */
                    console.log('[AzureOpenAI] 🔍 JSON 響應不提取推理摘要（僅用於非流式調用）');
                  } catch (jsonError) {
                    console.log('[AzureOpenAI] ❌ JSON 解析失敗:', (jsonError as Error).message);
                  }
                } else {
                  // 如果是 SSE 流，使用原有的流式讀取邏輯
                  console.log('[AzureOpenAI] 🔍 開始讀取 SSE 流以提取 reasoning...');

                  if (!clonedResponse.body) {
                    console.log('[AzureOpenAI] ⚠️ Cloned response has no body, skipping SSE reading');
                    return response;
                  }

                  const reader = clonedResponse.body.getReader();
                  const decoder = new TextDecoder();
                  let buffer = '';
                  let chunkCount = 0;

                  // 🔥 新增：用於累積增量推理摘要文本的變數
                  let reasoningSummaryAccumulator = '';
                  let isAccumulatingReasoning = false;

                  /*
                   * 讀取足夠的資料來找到 reasoning output items
                   * 增加限制以確保能夠完整讀取推理內容
                   */
                  console.log('[AzureOpenAI] 🔍 進入 while 循環，開始讀取 chunks...');

                  while (chunkCount < 100 && buffer.length < 200000) {
                    const { done, value } = await reader.read();

                    if (done) {
                      console.log('[AzureOpenAI] 🔍 Reader 已完成，退出循環');
                      break;
                    }

                    const chunkText = decoder.decode(value, { stream: true });
                    buffer += chunkText;
                    chunkCount++;

                    // 每10個chunk記錄一次，減少日誌量
                    if (chunkCount % 10 === 0) {
                      console.log(
                        `[AzureOpenAI] 🔍 Chunk ${chunkCount}: 長度=${chunkText.length}, Buffer總長度=${buffer.length}`,
                      );
                    }

                    // 改進的 SSE 事件解析 - 處理跨 chunk 的事件
                    const lines = buffer.split('\n');

                    // 保留最後一行（可能不完整），避免解析不完整的 JSON
                    const incompleteLine = lines.pop() || '';
                    buffer = incompleteLine;

                    for (const line of lines) {
                      // 跳過空行和註釋
                      if (!line.trim() || line.startsWith(':')) {
                        continue;
                      }

                      if (line.startsWith('data: ')) {
                        const dataContent = line.substring(6).trim();

                        // 跳過 [DONE] 標記
                        if (dataContent === '[DONE]') {
                          continue;
                        }

                        try {
                          const data = JSON.parse(dataContent);

                          // 🔍 DEBUG: 記錄推理相關事件
                          if (data.type && (data.type.includes('reasoning') || data.type.includes('summary'))) {
                            console.log('[AzureOpenAI] [SSE事件] 🔥', data.type);
                            console.log('[AzureOpenAI] [SSE事件] 📋 data 鍵:', Object.keys(data));
                          }

                          // 🔥 新格式：response.reasoning_summary_part.added - 推理摘要部分開始
                          if (data.type === 'response.reasoning_summary_part.added') {
                            isAccumulatingReasoning = true;
                            reasoningSummaryAccumulator = '';
                            console.log('[AzureOpenAI] ✅✅✅ 開始接收推理摘要增量事件');
                            console.log('[AzureOpenAI] 📋 isAccumulatingReasoning 設置為:', isAccumulatingReasoning);
                          }

                          // 🔥 新格式：response.reasoning_summary_text.delta - 推理摘要增量文本
                          if (data.type === 'response.reasoning_summary_text.delta') {
                            console.log('[AzureOpenAI] 📝 收到 delta 事件，data.delta 存在:', !!data.delta);
                            console.log('[AzureOpenAI] 📝 isAccumulatingReasoning 狀態:', isAccumulatingReasoning);

                            if (data.delta) {
                              console.log('[AzureOpenAI] 📝 delta 內容長度:', data.delta.length);

                              if (isAccumulatingReasoning) {
                                reasoningSummaryAccumulator += data.delta;

                                // 每10個delta記錄一次，減少日誌量
                                if (reasoningSummaryAccumulator.length % 100 < 10) {
                                  console.log(
                                    `[AzureOpenAI] 📝 累積推理摘要，當前長度: ${reasoningSummaryAccumulator.length}`,
                                  );
                                }
                              } else {
                                console.log('[AzureOpenAI] ⚠️ isAccumulatingReasoning 為 false，無法累積');
                              }
                            } else {
                              console.log('[AzureOpenAI] ⚠️ data.delta 不存在或為空');
                            }
                          }

                          // 🔥 新格式：response.reasoning_summary_text.done - 推理摘要完成
                          if (data.type === 'response.reasoning_summary_text.done') {
                            console.log('[AzureOpenAI] 📝 收到 done 事件');
                            console.log('[AzureOpenAI] 📝 isAccumulatingReasoning:', isAccumulatingReasoning);
                            console.log(
                              '[AzureOpenAI] 📝 reasoningSummaryAccumulator 長度:',
                              reasoningSummaryAccumulator.length,
                            );

                            if (isAccumulatingReasoning && reasoningSummaryAccumulator) {
                              reasoningSummary = reasoningSummaryAccumulator;
                              console.log('[AzureOpenAI] ✅✅✅ 推理摘要接收完成，總長度:', reasoningSummary.length);
                              console.log('[AzureOpenAI] 📝 摘要前300字:', reasoningSummary.substring(0, 300));
                              isAccumulatingReasoning = false;
                            } else {
                              console.log(
                                '[AzureOpenAI] ⚠️ 無法完成累積：isAccumulatingReasoning=',
                                isAccumulatingReasoning,
                                ', accumulator length=',
                                reasoningSummaryAccumulator.length,
                              );
                            }
                          }

                          // 檢查其他可能的事件格式（向後兼容）

                          // 格式 1: response.output_item.added
                          if (data.type === 'response.output_item.added' && data.item) {
                            const item = data.item;
                            console.log('[AzureOpenAI] [SSE] ✅ output_item.added, type:', item.type);

                            // 提取 reasoning encrypted content
                            if (item.type === 'reasoning' && item.encrypted_content) {
                              reasoningEncrypted = item.encrypted_content;
                              console.log('[AzureOpenAI] ✅ 找到加密推理內容，長度:', reasoningEncrypted?.length ?? 0);
                            }

                            // 提取 summary_text
                            if (item.type === 'summary_text' && item.text) {
                              reasoningSummary = item.text;
                              console.log(
                                '[AzureOpenAI] ✅✅✅ 找到推理摘要文本，長度:',
                                reasoningSummary?.length ?? 0,
                              );
                              console.log('[AzureOpenAI] 推理摘要前300字:', reasoningSummary?.substring(0, 300) ?? '');
                            }
                          }

                          // 格式 2: response.output_item.done（完整事件）
                          if (data.type === 'response.output_item.done' && data.item) {
                            const item = data.item;

                            if (item.type === 'summary_text' && item.text) {
                              reasoningSummary = item.text;
                              console.log(
                                '[AzureOpenAI] ✅✅✅ 從 output_item.done 找到推理摘要，長度:',
                                reasoningSummary?.length ?? 0,
                              );
                            }
                          }

                          // 格式 3: 直接的 reasoning 事件
                          if (data.type === 'reasoning' || data.reasoning) {
                            if (data.summary || data.text) {
                              reasoningSummary = data.summary || data.text;
                              console.log(
                                '[AzureOpenAI] ✅ 從 reasoning 事件找到摘要，長度:',
                                reasoningSummary?.length ?? 0,
                              );
                            }
                          }
                        } catch (parseError) {
                          // 只記錄非空的解析錯誤，減少日誌量
                          if (dataContent.length > 10) {
                            console.log('[AzureOpenAI] ⚠️ JSON 解析失敗:', (parseError as Error).message);
                          }
                        }
                      }
                    }

                    /*
                     * 如果已經找到 reasoning summary，再多讀幾個 chunk 確保完整性
                     * 避免過早退出導致內容截斷
                     */
                    if (reasoningSummary && chunkCount > 15) {
                      console.log('[AzureOpenAI] ✅ 已找到推理摘要且讀取足夠，停止讀取');
                      break;
                    }
                  }

                  console.log(`[AzureOpenAI] 🔍 循環結束，共讀取 ${chunkCount} 個 chunks`);
                  console.log(`[AzureOpenAI] 🔍 reasoningSummary 存在: ${!!reasoningSummary}`);
                  console.log(`[AzureOpenAI] 🔍 reasoningEncrypted 存在: ${!!reasoningEncrypted}`);
                }

                // 🔥 存儲推理摘要到全局 Map，供 onFinish 使用
                if (reasoningSummary || reasoningEncrypted) {
                  // 從 response headers 獲取 request ID，或生成 UUID
                  const requestId =
                    response.headers.get('x-request-id') ||
                    response.headers.get('x-ms-request-id') ||
                    response.headers.get('apim-request-id') ||
                    crypto.randomUUID();

                  // 存儲到全局 Map
                  reasoningSummaryStore.set(requestId, {
                    summary: reasoningSummary,
                    encrypted: reasoningEncrypted,
                  });

                  console.log('[AzureOpenAI] ✅✅✅ Reasoning 資料已存儲到全局 Map');
                  console.log('[AzureOpenAI] 📋 Request ID:', requestId);

                  if (reasoningSummary) {
                    console.log('[AzureOpenAI] Summary 長度:', reasoningSummary.length);
                    console.log('[AzureOpenAI] Summary 開頭:', reasoningSummary.substring(0, 100));
                  }

                  /*
                   * 🔥 將 request ID 添加到 response headers，讓 onFinish 能夠讀取
                   * 創建新的 Headers 物件（因為原始 headers 可能是只讀的）
                   */
                  const newHeaders = new Headers(response.headers);
                  newHeaders.set('x-reasoning-request-id', requestId);

                  // 創建新的 Response 物件with修改後的 headers
                  response = new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: newHeaders,
                  });

                  console.log('[AzureOpenAI] ✅ Request ID 已添加到 response headers');

                  // 執行清理
                  cleanupOldReasoningSummaries();
                } else {
                  console.log('[AzureOpenAI] ⚠️⚠️⚠️ 未找到 reasoning 摘要或加密內容');
                }
              } catch (readError) {
                console.log('[AzureOpenAI] ❌ 讀取回應內容時出錯:', readError);
                console.log('[AzureOpenAI] ❌ 錯誤詳情:', (readError as Error).message);
              }

              return response;
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
