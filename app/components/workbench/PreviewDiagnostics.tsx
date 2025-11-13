import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';
import { webcontainer, webcontainerContext } from '~/lib/webcontainer';

export function PreviewDiagnostics() {
  const [isOpen, setIsOpen] = useState(false);
  const [wcStatus, setWcStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [wcError, setWcError] = useState<string | null>(null);
  const previews = useStore(workbenchStore.previews);

  useEffect(() => {
    // Check WebContainer status
    webcontainer
      .then(() => {
        setWcStatus('ready');
      })
      .catch((error) => {
        setWcStatus('error');
        setWcError(error.message);
      });
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 px-3 py-2 bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor rounded-lg text-xs text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-4 transition-colors"
        title="預覽診斷"
      >
        <div className="flex items-center gap-2">
          <div className="i-ph:first-aid-kit" />
          診斷
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg shadow-lg">
      <div className="p-4 border-b border-bolt-elements-borderColor flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="i-ph:first-aid-kit text-lg" />
          <h3 className="font-semibold">預覽診斷</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary"
        >
          <div className="i-ph:x" />
        </button>
      </div>

      <div className="p-4 space-y-4 text-sm">
        {/* WebContainer 狀態 */}
        <div>
          <div className="font-semibold mb-2 flex items-center gap-2">
            {wcStatus === 'ready' ? (
              <div className="i-ph:check-circle text-green-500" />
            ) : wcStatus === 'error' ? (
              <div className="i-ph:x-circle text-red-500" />
            ) : (
              <div className="i-ph:spinner animate-spin" />
            )}
            WebContainer
          </div>
          <div className="pl-6 text-bolt-elements-textSecondary">
            狀態: {wcStatus === 'ready' ? '✅ 就緒' : wcStatus === 'error' ? '❌ 錯誤' : '⏳ 載入中'}
          </div>
          {wcStatus === 'ready' && (
            <div className="pl-6 text-bolt-elements-textSecondary">
              已載入: {webcontainerContext.loaded ? '是' : '否'}
            </div>
          )}
          {wcError && <div className="pl-6 text-red-500 text-xs mt-1">錯誤: {wcError}</div>}
        </div>

        {/* 預覽狀態 */}
        <div>
          <div className="font-semibold mb-2 flex items-center gap-2">
            {previews.length > 0 ? (
              <div className="i-ph:check-circle text-green-500" />
            ) : (
              <div className="i-ph:warning text-yellow-500" />
            )}
            預覽
          </div>
          <div className="pl-6 text-bolt-elements-textSecondary">可用預覽數量: {previews.length}</div>
          {previews.length > 0 && (
            <div className="pl-6 space-y-1 mt-2">
              {previews.map((preview, idx) => (
                <div key={idx} className="text-xs">
                  <div>
                    端口 {preview.port}: {preview.ready ? '✅ 就緒' : '⏳ 準備中'}
                  </div>
                  <div className="text-bolt-elements-textTertiary truncate">{preview.baseUrl}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 建議 */}
        {previews.length === 0 && wcStatus === 'ready' && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs">
            <div className="font-semibold mb-1">💡 建議</div>
            <ul className="space-y-1 list-disc list-inside">
              <li>檢查終端機輸出是否有錯誤</li>
              <li>確認開發伺服器是否已啟動</li>
              <li>嘗試在聊天中輸入「請啟動應用程式」</li>
              <li>打開瀏覽器控制台查看 [WebContainer] 和 [Preview] 日誌</li>
            </ul>
          </div>
        )}

        {/* 控制台日誌提示 */}
        <div className="p-3 bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor rounded text-xs">
          <div className="font-semibold mb-1">🔍 查看詳細日誌</div>
          <div>按 F12 打開瀏覽器控制台，查找以下日誌：</div>
          <ul className="mt-1 space-y-0.5 text-bolt-elements-textTertiary">
            <li>• [WebContainer] - WebContainer 事件</li>
            <li>• [Preview] - 預覽相關事件</li>
            <li>• [ActionRunner] - 命令執行</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
