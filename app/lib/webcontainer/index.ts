import { WebContainer } from '@webcontainer/api';
import { WORK_DIR_NAME } from '~/utils/constants';
import { cleanStackTrace } from '~/utils/stacktrace';

interface WebContainerContext {
  loaded: boolean;
}

export const webcontainerContext: WebContainerContext = import.meta.hot?.data?.webcontainerContext ?? {
  loaded: false,
};

if (import.meta.hot) {
  (import.meta.hot.data as any) ??= {};
  import.meta.hot.data.webcontainerContext = webcontainerContext;
}

export let webcontainer: Promise<WebContainer> = new Promise(() => {
  // noop for ssr
});

if (!import.meta.env.SSR) {
  webcontainer =
    import.meta.hot?.data?.webcontainer ??
    Promise.resolve()
      .then(() => {
        console.log('[WebContainer] 🚀 開始啟動 WebContainer...');
        return WebContainer.boot({
          coep: 'credentialless',
          workdirName: WORK_DIR_NAME,
          forwardPreviewErrors: true, // Enable error forwarding from iframes
        });
      })
      .then(async (webcontainer) => {
        console.log('[WebContainer] ✅ WebContainer 啟動成功');
        webcontainerContext.loaded = true;

        const { workbenchStore } = await import('~/lib/stores/workbench');

        const response = await fetch('/inspector-script.js');
        const inspectorScript = await response.text();
        await webcontainer.setPreviewScript(inspectorScript);
        console.log('[WebContainer] 📜 預覽腳本已設置');

        // Listen for server-ready events
        webcontainer.on('server-ready', (port, url) => {
          console.log(`[WebContainer] 🌐 伺服器就緒 - Port: ${port}, URL: ${url}`);
        });

        // Listen for port events with detailed logging
        webcontainer.on('port', (port, type, url) => {
          console.log(`[WebContainer] 🔌 端口事件 - Port: ${port}, Type: ${type}, URL: ${url}`);
        });

        // Listen for preview errors
        webcontainer.on('preview-message', (message) => {
          console.log('[WebContainer] 📨 預覽訊息:', message);

          // Handle both uncaught exceptions and unhandled promise rejections
          if (message.type === 'PREVIEW_UNCAUGHT_EXCEPTION' || message.type === 'PREVIEW_UNHANDLED_REJECTION') {
            const isPromise = message.type === 'PREVIEW_UNHANDLED_REJECTION';
            const title = isPromise ? 'Unhandled Promise Rejection' : 'Uncaught Exception';
            workbenchStore.actionAlert.set({
              type: 'preview',
              title,
              description: 'message' in message ? message.message : 'Unknown error',
              content: `Error occurred at ${message.pathname}${message.search}${message.hash}\nPort: ${message.port}\n\nStack trace:\n${cleanStackTrace(message.stack || '')}`,
              source: 'preview',
            });
          }
        });

        console.log('[WebContainer] 🎧 事件監聽器已設置');

        return webcontainer;
      })
      .catch((error) => {
        console.error('[WebContainer] ❌ 初始化失敗:', error);
        throw error;
      });

  if (import.meta.hot) {
    (import.meta.hot.data as any) ??= {};
    import.meta.hot.data.webcontainer = webcontainer;
  }
}
