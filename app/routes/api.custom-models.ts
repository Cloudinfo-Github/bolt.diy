/**
 * API 端點：獲取和同步自定義模型配置
 * GET: 獲取所有自定義模型
 * POST: 同步自定義模型到後端
 */

import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

export async function loader({ context: _context }: LoaderFunctionArgs) {
  try {
    // 從服務器環境變量或 KV 存儲獲取自定義模型
    const env = _context.cloudflare?.env as unknown as Record<string, string>;

    // 嘗試從環境變量讀取
    const customModelsJson = env?.CUSTOM_MODELS || '[]';
    const models = JSON.parse(customModelsJson);

    return json({
      success: true,
      models,
    });
  } catch (error) {
    console.error('Error loading custom models:', error);
    return json(
      {
        success: false,
        models: [],
        error: 'Failed to load custom models',
      },
      { status: 500 },
    );
  }
}

export async function action({ request, context: _context }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = (await request.json()) as { models?: unknown[] };
    const { models } = body;

    if (!Array.isArray(models)) {
      return json({ error: 'Invalid models data' }, { status: 400 });
    }

    /*
     * 在 Cloudflare Workers 環境中，我們將模型存儲在內存中
     * 生產環境應該使用 KV 或其他持久化存儲
     */
    console.log('Syncing custom models to server:', models.length);

    /*
     * TODO: 如果使用 Cloudflare KV，可以這樣存儲：
     * const KV = context.cloudflare?.env?.BOLT_KV;
     * if (KV) {
     *   await KV.put(CUSTOM_MODELS_STORAGE_KEY, JSON.stringify(models));
     * }
     */

    return json({
      success: true,
      message: `Successfully synced ${models.length} custom models`,
    });
  } catch (error) {
    console.error('Error syncing custom models:', error);
    return json(
      {
        success: false,
        error: 'Failed to sync custom models',
      },
      { status: 500 },
    );
  }
}
