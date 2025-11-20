/**
 * API 端點：獲取和同步自定義模型配置
 * GET: 獲取所有自定義模型
 * POST: 同步自定義模型到後端
 * PUT: 更新單個模型
 * DELETE: 刪除單個模型
 */

import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

const CUSTOM_MODELS_KV_KEY = 'custom_models';

interface CloudflareEnv {
  BOLT_KV?: KVNamespace;
  CUSTOM_MODELS?: string;
}

export async function loader({ context }: LoaderFunctionArgs) {
  try {
    const env = context.cloudflare?.env as CloudflareEnv;
    let models = [];

    // 優先從 KV 讀取
    if (env?.BOLT_KV) {
      const stored = await env.BOLT_KV.get(CUSTOM_MODELS_KV_KEY);

      if (stored) {
        models = JSON.parse(stored);
        console.log(`[CustomModels] Loaded ${models.length} models from KV`);
      }
    }

    // 如果 KV 沒有數據，嘗試從環境變量讀取
    if (models.length === 0 && env?.CUSTOM_MODELS) {
      models = JSON.parse(env.CUSTOM_MODELS);
      console.log(`[CustomModels] Loaded ${models.length} models from env`);
    }

    return json({
      success: true,
      models,
      source: env?.BOLT_KV ? 'kv' : 'env',
    });
  } catch (error) {
    console.error('[CustomModels] Error loading:', error);
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

export async function action({ request, context }: ActionFunctionArgs) {
  const method = request.method;
  const env = context.cloudflare?.env as CloudflareEnv;

  try {
    const body = await request.json();

    switch (method) {
      case 'POST': {
        // 同步所有模型
        const { models } = body as { models?: unknown[] };

        if (!Array.isArray(models)) {
          return json({ error: 'Invalid models data' }, { status: 400 });
        }

        // 存儲到 KV
        if (env?.BOLT_KV) {
          await env.BOLT_KV.put(CUSTOM_MODELS_KV_KEY, JSON.stringify(models));
          console.log(`[CustomModels] Synced ${models.length} models to KV`);
        }

        return json({
          success: true,
          message: `Successfully synced ${models.length} custom models`,
          count: models.length,
        });
      }

      case 'PUT': {
        // 更新單個模型
        const { id, model } = body as { id?: string; model?: unknown };

        if (!id || !model) {
          return json({ error: 'Missing id or model data' }, { status: 400 });
        }

        if (env?.BOLT_KV) {
          const stored = await env.BOLT_KV.get(CUSTOM_MODELS_KV_KEY);
          const models = stored ? JSON.parse(stored) : [];
          const index = models.findIndex((m: { id: string }) => m.id === id);

          if (index !== -1) {
            models[index] = model;
          } else {
            models.push(model);
          }

          await env.BOLT_KV.put(CUSTOM_MODELS_KV_KEY, JSON.stringify(models));
          console.log(`[CustomModels] Updated model ${id}`);
        }

        return json({
          success: true,
          message: 'Model updated successfully',
        });
      }

      case 'DELETE': {
        // 刪除單個模型
        const { id } = body as { id?: string };

        if (!id) {
          return json({ error: 'Missing model id' }, { status: 400 });
        }

        if (env?.BOLT_KV) {
          const stored = await env.BOLT_KV.get(CUSTOM_MODELS_KV_KEY);
          const models = stored ? JSON.parse(stored) : [];
          const filtered = models.filter((m: { id: string }) => m.id !== id);

          await env.BOLT_KV.put(CUSTOM_MODELS_KV_KEY, JSON.stringify(filtered));
          console.log(`[CustomModels] Deleted model ${id}`);
        }

        return json({
          success: true,
          message: 'Model deleted successfully',
        });
      }

      default:
        return json({ error: 'Method not allowed' }, { status: 405 });
    }
  } catch (error) {
    console.error('[CustomModels] Error in action:', error);
    return json(
      {
        success: false,
        error: 'Failed to process request',
      },
      { status: 500 },
    );
  }
}
