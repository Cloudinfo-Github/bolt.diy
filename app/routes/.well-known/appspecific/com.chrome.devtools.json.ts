import type { LoaderFunctionArgs } from '@remix-run/cloudflare';

/*
 * Chrome (Canary) DevTools 會主動抓取 /.well-known/appspecific/com.chrome.devtools.json
 * 避免在開發時刷出 404 噪音，提供一個最小空 JSON 回應。
 */
export async function loader(_args: LoaderFunctionArgs) {
  return new Response('{}', {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}
