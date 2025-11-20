import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { createUIMessageStream, createUIMessageStreamResponse, generateId } from 'ai';
import { MAX_RESPONSE_SEGMENTS, MAX_TOKENS, isReasoningModel, type FileMap } from '~/lib/.server/llm/constants';
import { CONTINUE_PROMPT } from '~/lib/common/prompts/prompts';
import { streamText, type Messages, type StreamingOptions } from '~/lib/.server/llm/stream-text';
import type { IProviderSetting } from '~/types/model';
import { createScopedLogger } from '~/utils/logger';
import { getFilePaths } from '~/lib/.server/llm/select-context';
import { REASONING_ANNOTATION_TYPE, USAGE_ANNOTATION_TYPE, type ReasoningAnnotation } from '~/types/context';
import { extractPropertiesFromMessage } from '~/lib/.server/llm/utils';
import type { DesignScheme } from '~/types/design-scheme';
import { MCPService } from '~/lib/services/mcpService';
import { StreamRecoveryManager } from '~/lib/.server/llm/stream-recovery';
import { getReasoningSummary } from '~/lib/modules/llm/providers/azure-openai';

export async function action(args: ActionFunctionArgs) {
  return chatAction(args);
}

const logger = createScopedLogger('api.chat');

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};

  const items = cookieHeader.split(';').map((cookie) => cookie.trim());

  items.forEach((item) => {
    const [name, ...rest] = item.split('=');

    if (name && rest) {
      const decodedName = decodeURIComponent(name.trim());
      const decodedValue = decodeURIComponent(rest.join('=').trim());
      cookies[decodedName] = decodedValue;
    }
  });

  return cookies;
}

async function chatAction({ context, request }: ActionFunctionArgs) {
  const streamRecovery = new StreamRecoveryManager({
    timeout: 180000, // 3 minutes - Azure Responses API needs time for reasoning on large projects
    maxRetries: 2,
    onTimeout: () => {
      logger.warn('Stream timeout - attempting recovery');
    },
  });
  let responseSegments = 0;

  const { messages, files, promptId, contextOptimization, supabase, chatMode, designScheme, webSearchEnabled } =
    await request.json<{
      messages: Messages;
      files: any;
      promptId?: string;
      contextOptimization: boolean;
      chatMode: 'discuss' | 'build';
      designScheme?: DesignScheme;
      supabase?: {
        isConnected: boolean;
        hasSelectedProject: boolean;
        credentials?: {
          anonKey?: string;
          supabaseUrl?: string;
        };
      };
      maxLLMSteps: number;
      webSearchEnabled?: boolean;
    }>();

  const cookieHeader = request.headers.get('Cookie');
  const apiKeys = JSON.parse(parseCookies(cookieHeader || '').apiKeys || '{}');
  const providerSettings: Record<string, IProviderSetting> = JSON.parse(
    parseCookies(cookieHeader || '').providers || '{}',
  );

  const cumulativeUsage = {
    completionTokens: 0,
    promptTokens: 0,
    totalTokens: 0,
  };
  let progressCounter: number = 1;

  try {
    const mcpService = MCPService.getInstance();
    const totalMessageContent = messages.reduce((acc, message) => {
      const textContent = message.parts
        .filter((part) => part.type === 'text')
        .map((part) => part.text)
        .join('');
      return acc + textContent;
    }, '');
    logger.debug(`Total message length: ${totalMessageContent.split(' ').length}, words`);

    logger.debug(`Total message length: ${totalMessageContent.split(' ').length}, words`);

    const stream = createUIMessageStream({
      async execute({ writer }) {
        streamRecovery.startMonitoring();

        const filePaths = getFilePaths(files || {});
        const filteredFiles: FileMap | undefined = undefined;
        const summary: string | undefined = undefined;
        let messageSliceId = 0;

        const processedMessages = await mcpService.processToolInvocations(messages, writer);

        if (processedMessages.length > 3) {
          messageSliceId = processedMessages.length - 3;
        }

        if (filePaths.length > 0 && contextOptimization) {
          logger.debug('Generating Chat Summary');
          writer.write({
            type: 'data-progress',
            label: 'summary',
            status: 'in-progress',
            order: progressCounter++,
            message: 'Analysing Request',
          } as any);

          // （已移除錯誤插入的推理迴圈，summary 邏輯保持原樣）
        }

        const options: StreamingOptions = {
          supabaseConnection: supabase,
          toolChoice: 'auto',
          tools: mcpService.toolsWithoutExecute,

          // maxSteps: maxLLMSteps,
          onStepFinish: ({ toolCalls }) => {
            toolCalls.forEach((toolCall) => {
              mcpService.processToolCall(toolCall as any, writer);
            });
          },
          onFinish: async (result: any) => {
            const { text: content, finishReason, usage, response } = result;
            const experimentalProviderMetadata = (result as any).experimental_providerMetadata;
            logger.info('[onFinish] ========== CALLBACK CALLED ==========');

            // Mark analysis as complete if it was started
            if (filePaths.length > 0 && contextOptimization) {
              writer.write({
                type: 'data-progress',
                label: 'summary',
                status: 'complete',
                order: progressCounter++,
                message: 'Analysis Complete',
              } as any);
            }

            logger.debug('usage', JSON.stringify(usage));
            logger.debug('finishReason', finishReason);
            logger.debug('experimentalProviderMetadata', JSON.stringify(experimentalProviderMetadata));
            logger.debug('response keys', response ? Object.keys(response) : 'no response');

            // 提取 reasoning summary（官方推薦方式）
            let reasoningSummary: string | undefined;
            let reasoningContent: string | undefined;

            try {
              // 🔥 方法 1 (最優先): 從全局 Map 讀取推理摘要（通過 request ID）
              if (response && response.headers) {
                let requestId: string | null = null;

                // 檢查 headers 是否是 Headers 實例或普通對象
                if (typeof (response.headers as any).get === 'function') {
                  // 標準 Headers 物件
                  requestId = (response.headers as any).get('x-reasoning-request-id');
                } else if (typeof response.headers === 'object') {
                  // 普通對象
                  requestId = (response.headers as any)['x-reasoning-request-id'] || null;
                }

                if (requestId) {
                  logger.info('[Reasoning] 🔍 Found x-reasoning-request-id:', requestId);

                  const azureData = getReasoningSummary(requestId);

                  if (azureData) {
                    logger.info('[Reasoning] ✅✅✅ 從全局 Map 中找到推理摘要！');

                    if (azureData.summary && typeof azureData.summary === 'string') {
                      reasoningSummary = azureData.summary;
                      logger.info('[Reasoning] Summary 長度:', reasoningSummary.length);
                      logger.debug('[Reasoning] Summary 開頭:', reasoningSummary.substring(0, 200));
                    } else if (azureData.encrypted && typeof azureData.encrypted === 'string') {
                      // 如果只有加密內容，創建一個說明訊息
                      reasoningSummary = `🔐 推理內容已加密\n\n此回應包含加密的推理內容（${azureData.encrypted.length} 字符）。Azure OpenAI 提供的推理內容是加密格式，目前無法直接顯示原始思考過程。\n\n但是，模型的推理過程已經完成，並反映在最終的回應中。`;
                      logger.info('[Reasoning] ⚠️ 只找到加密的推理內容，創建說明訊息');
                    }
                  } else {
                    logger.warn('[Reasoning] ⚠️ 從全局 Map 中未找到推理數據，request ID:', requestId);
                  }
                } else {
                  logger.debug('[Reasoning] 未找到 x-reasoning-request-id header');
                }
              }

              // 方法 2: 從 response 物件提取其他屬性（備用方案）
              if (!reasoningSummary && !reasoningContent && response) {
                logger.debug('[Reasoning] Attempting to extract from response object properties');

                const responseObj = response as any;

                if (responseObj.reasoning) {
                  reasoningContent = responseObj.reasoning;
                  logger.info('[Reasoning] ✅ Found reasoning in response.reasoning');
                } else if (responseObj.reasoningSummary) {
                  reasoningSummary = responseObj.reasoningSummary;
                  logger.info('[Reasoning] ✅ Found reasoningSummary in response.reasoningSummary');
                } else if (responseObj.headers) {
                  // 嘗試從 headers 中提取
                  logger.debug('[Reasoning] Checking response headers for reasoning content');

                  const headers = responseObj.headers;

                  if (headers && typeof headers.get === 'function') {
                    const reasoningHeader = headers.get('x-reasoning-summary') || headers.get('reasoning-summary');

                    if (reasoningHeader) {
                      reasoningSummary = reasoningHeader;
                      logger.info('[Reasoning] ✅ Found reasoning in response headers');
                    }
                  }
                }
              }

              // 方法 2: 從 experimentalProviderMetadata 提取（Vercel AI SDK 官方方式）
              if (!reasoningSummary && !reasoningContent) {
                if (experimentalProviderMetadata?.azure?.reasoningSummary) {
                  reasoningSummary = String(experimentalProviderMetadata.azure.reasoningSummary);
                  logger.info('[Reasoning] ✅ Found reasoningSummary in experimentalProviderMetadata.azure');
                } else if (experimentalProviderMetadata?.openai?.reasoningSummary) {
                  reasoningSummary = String(experimentalProviderMetadata.openai.reasoningSummary);
                  logger.info('[Reasoning] ✅ Found reasoningSummary in experimentalProviderMetadata.openai');
                }
              }

              // 方法 3: 檢查是否有 reasoningTokens（表示模型使用了推理但內容未提取）
              if (!reasoningSummary && !reasoningContent) {
                const reasoningTokens = experimentalProviderMetadata?.openai?.reasoningTokens;
                const hasReasoningTokens = typeof reasoningTokens === 'number' && reasoningTokens > 0;

                if (hasReasoningTokens) {
                  logger.warn(`[Reasoning] ⚠️ 模型使用了 ${reasoningTokens} 個推理 tokens，但未能提取推理內容`);
                  logger.warn('[Reasoning] 這可能是 AI SDK v5 對 Azure Responses API 的支援問題');

                  // 創建一個提示信息
                  reasoningSummary = `此回應使用了 ${reasoningTokens} 個推理 tokens 進行深度思考。\n\n注意：推理過程已在生成回應時完成，但詳細內容暫時無法完整提取。`;
                }
              }

              // 如果找到 reasoning 內容，發送到前端
              const finalReasoningContent = reasoningSummary || reasoningContent;

              if (finalReasoningContent) {
                logger.info('[Reasoning] ✅ Reasoning content found, length:', finalReasoningContent.length);
                logger.debug('[Reasoning] Content preview:', finalReasoningContent.substring(0, 200));

                // 發送 reasoning 內容作為自定義註解（統一格式）
                const reasoningAnnotation: ReasoningAnnotation = {
                  type: REASONING_ANNOTATION_TYPE,
                  summary: finalReasoningContent,
                  provider: experimentalProviderMetadata?.azure
                    ? 'azure'
                    : experimentalProviderMetadata?.openai
                      ? 'openai'
                      : undefined,
                  model: response?.modelId,
                };

                writer.write({
                  ...reasoningAnnotation,
                  type: `data-${reasoningAnnotation.type}`,
                } as any);

                logger.info('[Reasoning] ✅ Reasoning annotation sent to frontend');
              } else {
                logger.warn('[Reasoning] ⚠️ No reasoning content found in response');
                logger.warn(
                  '[Reasoning] Available metadata:',
                  JSON.stringify(
                    {
                      hasAzureMetadata: !!experimentalProviderMetadata?.azure,
                      hasOpenAIMetadata: !!experimentalProviderMetadata?.openai,
                      azureKeys: experimentalProviderMetadata?.azure
                        ? Object.keys(experimentalProviderMetadata.azure)
                        : [],
                      openaiKeys: experimentalProviderMetadata?.openai
                        ? Object.keys(experimentalProviderMetadata.openai)
                        : [],
                      reasoningTokens: experimentalProviderMetadata?.openai?.reasoningTokens,
                    },
                    null,
                    2,
                  ),
                );
              }
            } catch (error) {
              logger.error('[Reasoning] Error extracting reasoning content:', error);
            }

            if (usage) {
              cumulativeUsage.completionTokens += (usage as any).completionTokens || 0;
              cumulativeUsage.promptTokens += (usage as any).promptTokens || 0;
              cumulativeUsage.totalTokens += (usage as any).totalTokens || 0;
            }

            if (finishReason !== 'length') {
              writer.write({
                type: `data-${USAGE_ANNOTATION_TYPE}`,
                value: {
                  completionTokens: cumulativeUsage.completionTokens,
                  promptTokens: cumulativeUsage.promptTokens,
                  totalTokens: cumulativeUsage.totalTokens,
                },
              } as any);
              writer.write({
                type: 'data-progress',
                label: 'response',
                status: 'complete',
                order: progressCounter++,
                message: 'Response Generated',
              } as any);
              streamRecovery.stop();
              await new Promise((resolve) => setTimeout(resolve, 0));

              return;
            }

            if (responseSegments >= MAX_RESPONSE_SEGMENTS) {
              streamRecovery.stop();
              throw Error('Cannot continue message: Maximum segments reached');
            }

            const switchesLeft = MAX_RESPONSE_SEGMENTS - responseSegments;
            logger.info(`Reached max token limit (${MAX_TOKENS}): Continuing message (${switchesLeft} switches left)`);

            const lastUserMessage = processedMessages.filter((x) => x.role === 'user').slice(-1)[0];
            const { model, provider } = extractPropertiesFromMessage(lastUserMessage);
            processedMessages.push({ id: generateId(), role: 'assistant', parts: [{ type: 'text', text: content }] });
            processedMessages.push({
              id: generateId(),
              role: 'user',
              parts: [
                {
                  type: 'text',
                  text: `[Model: ${model}]\n\n[Provider: ${provider}]\n\n${CONTINUE_PROMPT}`,
                },
              ],
            });

            responseSegments += 1;

            const continuationResult = await streamText({
              messages: [...processedMessages] as any,
              env: context.cloudflare?.env,
              options,
              apiKeys,
              files,
              providerSettings,
              promptId,
              contextOptimization,
              contextFiles: filteredFiles,
              chatMode,
              designScheme,
              summary,
              messageSliceId,
              webSearchEnabled,
            });

            // Monitor fullStream in continuation
            (async () => {
              try {
                for await (const part of (continuationResult as any).fullStream) {
                  streamRecovery.updateActivity();

                  if (part.type === 'error') {
                    const error: any = part.error;
                    logger.error('Continuation streaming error:', error);
                    streamRecovery.stop();

                    return;
                  }
                }

                streamRecovery.stop();
              } catch (error) {
                logger.error('Error in continuation fullStream monitoring:', error);
                streamRecovery.stop();
              }
            })();

            // 使用 AI SDK 正確的流合併方法，並啟用推理內容傳輸
            writer.merge((continuationResult as any).toUIMessageStream());
          },
        };

        // 檢測是否為 reasoning model（用於進度消息）
        const lastUserMessage = processedMessages.filter((x) => x.role === 'user').slice(-1)[0];
        const { model: selectedModel } = extractPropertiesFromMessage(lastUserMessage);
        const isReasoning = isReasoningModel(selectedModel);

        /*
         * 不再提前發送「思考中」提示，等待真正的推理內容從 onFinish 返回
         * 這樣可以避免顯示佔位符文字
         */

        writer.write({
          type: 'data-progress',
          label: 'response',
          status: 'in-progress',
          order: progressCounter++,
          message: isReasoning ? 'AI 深度思考中...' : 'Generating Response',
        } as any);

        const result = await streamText({
          messages: [...processedMessages] as any,
          env: context.cloudflare?.env,
          options,
          apiKeys,
          files,
          providerSettings,
          promptId,
          contextOptimization,
          contextFiles: filteredFiles,
          chatMode,
          designScheme,
          summary,
          messageSliceId,
          webSearchEnabled,
        });

        // Monitor fullStream to update recovery activity and handle errors
        (async () => {
          try {
            for await (const part of result.fullStream) {
              streamRecovery.updateActivity();

              if (part.type === 'error') {
                const error: any = part.error;
                logger.error('Streaming error:', error);
                streamRecovery.stop();

                // Enhanced error handling for common streaming issues
                if (error.message?.includes('Invalid JSON response')) {
                  logger.error('Invalid JSON response detected - likely malformed API response');
                } else if (error.message?.includes('token')) {
                  logger.error('Token-related error detected - possible token limit exceeded');
                }

                return;
              }
            }

            streamRecovery.stop();
          } catch (error) {
            logger.error('Error in fullStream monitoring:', error);
            streamRecovery.stop();
          }
        })();

        // 使用 AI SDK 正確的流合併方法，並啟用推理內容傳輸
        writer.merge(result.toUIMessageStream());
      },
      onError: (error: any) => {
        streamRecovery.stop();

        // Provide more specific error messages for common issues
        const errorMessage = error.message || 'Unknown error';

        if (errorMessage.includes('model') && errorMessage.includes('not found')) {
          return 'Custom error: Invalid model selected. Please check that the model name is correct and available.';
        }

        if (errorMessage.includes('Invalid JSON response')) {
          return 'Custom error: The AI service returned an invalid response. This may be due to an invalid model name, API rate limiting, or server issues. Try selecting a different model or check your API key.';
        }

        if (
          errorMessage.includes('API key') ||
          errorMessage.includes('unauthorized') ||
          errorMessage.includes('authentication')
        ) {
          return 'Custom error: Invalid or missing API key. Please check your API key configuration.';
        }

        if (errorMessage.includes('token') && errorMessage.includes('limit')) {
          return 'Custom error: Token limit exceeded. The conversation is too long for the selected model. Try using a model with larger context window or start a new conversation.';
        }

        if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
          return 'Custom error: API rate limit exceeded. Please wait a moment before trying again.';
        }

        if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
          return 'Custom error: Network error. Please check your internet connection and try again.';
        }

        return `Custom error: ${errorMessage}`;
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error: any) {
    streamRecovery.stop();
    logger.error(error);

    const errorResponse = {
      error: true,
      message: error.message || 'An unexpected error occurred',
      statusCode: error.statusCode || 500,
      isRetryable: error.isRetryable !== false, // Default to retryable unless explicitly false
      provider: error.provider || 'unknown',
    };

    if (error.message?.includes('API key')) {
      return new Response(
        JSON.stringify({
          ...errorResponse,
          message: 'Invalid or missing API key',
          statusCode: 401,
          isRetryable: false,
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
          statusText: 'Unauthorized',
        },
      );
    }

    return new Response(JSON.stringify(errorResponse), {
      status: errorResponse.statusCode,
      headers: { 'Content-Type': 'application/json' },
      statusText: 'Error',
    });
  }
}
