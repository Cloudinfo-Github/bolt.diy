import { cloudflareDevProxyVitePlugin as remixCloudflareDevProxy, vitePlugin as remixVitePlugin } from '@remix-run/dev';
import UnoCSS from 'unocss/vite';
import { defineConfig, type ViteDevServer } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { optimizeCssModules } from 'vite-plugin-optimize-css-modules';
import tsconfigPaths from 'vite-tsconfig-paths';
import * as dotenv from 'dotenv';

// Load environment variables from multiple files
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
dotenv.config();

export default defineConfig((config) => {
  return {
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
    build: {
      target: 'esnext',
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // 將程式碼語言檔案分組到獨立 chunk（延遲載入）
            if (id.includes('shiki/langs')) {
              return 'code-languages';
            }
            // 將大型依賴項分組
            if (id.includes('node_modules')) {
              // AI SDK 相關
              if (id.includes('@ai-sdk') || id.includes('ai/')) {
                return 'ai-sdk';
              }
              // CodeMirror 編輯器
              if (id.includes('@codemirror') || id.includes('@lezer')) {
                return 'codemirror';
              }
              // Chart 和視覺化
              if (id.includes('chart.js') || id.includes('react-chartjs')) {
                return 'charts';
              }
              // PDF 和文件處理
              if (id.includes('jspdf') || id.includes('html2canvas')) {
                return 'document';
              }
              // 圖示庫
              if (id.includes('@iconify') || id.includes('@phosphor-icons') || id.includes('react-icons')) {
                return 'icons';
              }
              // Radix UI 元件
              if (id.includes('@radix-ui')) {
                return 'radix-ui';
              }
              // WebContainer
              if (id.includes('@webcontainer')) {
                return 'webcontainer';
              }
              // Markdown 和語法突顯
              if (id.includes('react-markdown') || id.includes('rehype') || id.includes('remark')) {
                return 'markdown';
              }
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    plugins: [
      nodePolyfills({
        include: ['buffer', 'process', 'util', 'stream'],
        globals: {
          Buffer: true,
          process: true,
          global: true,
        },
        protocolImports: true,
        exclude: ['child_process', 'fs', 'path'],
      }),
      {
        name: 'buffer-polyfill',
        transform(code, id) {
          if (id.includes('env.mjs')) {
            return {
              code: `import { Buffer } from 'buffer';\n${code}`,
              map: null,
            };
          }

          return null;
        },
      },
      config.mode !== 'test' && remixCloudflareDevProxy(),
      remixVitePlugin({
        future: {
          v3_fetcherPersist: true,
          v3_relativeSplatPath: true,
          v3_throwAbortReason: true,
          v3_lazyRouteDiscovery: true,
        },
      }),
      UnoCSS(),
      tsconfigPaths(),
      chrome129IssuePlugin(),
      config.mode === 'production' && optimizeCssModules({ apply: 'build' }),
    ],
    envPrefix: [
      'VITE_',
      'OPENAI_LIKE_API_BASE_URL',
      'OPENAI_LIKE_API_MODELS',
      'OLLAMA_API_BASE_URL',
      'LMSTUDIO_API_BASE_URL',
      'TOGETHER_API_BASE_URL',
    ],
    css: {
      preprocessorOptions: {
        scss: {
          // api: 'modern-compiler', // Removed for Vite 7 compatibility
        },
      },
    },
    test: {
      environment: 'jsdom',
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/cypress/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
        '**/tests/preview/**', // Exclude preview tests that require Playwright
      ],
    },
  };
});

function chrome129IssuePlugin() {
  return {
    name: 'chrome129IssuePlugin',
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        const raw = req.headers['user-agent']?.match(/Chrom(e|ium)\/([0-9]+)\./);

        if (raw) {
          const version = parseInt(raw[2], 10);

          if (version === 129) {
            res.setHeader('content-type', 'text/html');
            res.end(
              '<body><h1>Please use Chrome Canary for testing.</h1><p>Chrome 129 has an issue with JavaScript modules & Vite local development, see <a href="https://github.com/stackblitz/bolt.new/issues/86#issuecomment-2395519258">for more information.</a></p><p><b>Note:</b> This only impacts <u>local development</u>. `pnpm run build` and `pnpm run start` will work fine in this browser.</p></body>',
            );

            return;
          }
        }

        next();
      });
    },
  };
}