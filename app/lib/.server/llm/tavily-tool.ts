import { tavily } from '@tavily/core';
import { tool } from 'ai';
import { z } from 'zod';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('tavily-tool');

/**
 * 建立 Tavily 客戶端
 * 如果未提供 API key 則返回 null
 */
function createTavilyClient(apiKey?: string) {
  if (!apiKey) {
    logger.warn('TAVILY_API_KEY not found in environment variables. Web search will be disabled.');
    return null;
  }

  return tavily({ apiKey });
}

/**
 * Tavily 網路搜尋工具
 * 使用 Tavily API 進行即時網路搜尋，獲取最新資訊
 */
export function createWebSearchTool(env?: Env) {
  const apiKey = env?.TAVILY_API_KEY;
  const tavilyClient = createTavilyClient(apiKey);

  if (!tavilyClient) {
    return null;
  }

  return tool({
    description:
      '使用 Tavily API 搜尋網路上的最新資訊。適用於需要即時資訊、最新新聞、技術文件或任何需要查詢網路的情況。',
    parameters: z.object({
      query: z.string().min(1).max(400).describe('搜尋查詢字串，使用繁體中文或英文'),
    }),
    execute: async ({ query }) => {
      try {
        const maxResults = 5;
        const searchDepth = 'advanced';
        const includeAnswer = true;

        logger.info(`執行網路搜尋：query="${query}", maxResults=${maxResults}, searchDepth=${searchDepth}`);

        const response = await tavilyClient.search(query, {
          maxResults,
          searchDepth,
          includeAnswer,
        });

        logger.info(`搜尋完成，返回 ${response.results?.length || 0} 個結果`);

        // 格式化回應
        const results = {
          query,
          answer: response.answer || null,
          results:
            response.results?.map((result: any) => ({
              title: result.title,
              url: result.url,
              content: result.content,
              score: result.score,
            })) || [],
        };

        return {
          success: true,
          data: results,
          message: `找到 ${results.results.length} 個相關結果`,
        };
      } catch (error: any) {
        logger.error('Tavily 搜尋失敗:', error);
        return {
          success: false,
          error: error.message || '搜尋時發生未知錯誤',
          message: '網路搜尋失敗，請稍後再試',
        };
      }
    },
  });
}
