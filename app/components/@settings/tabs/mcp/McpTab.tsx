import { useEffect, useMemo, useState } from 'react';
import { classNames } from '~/utils/classNames';
import type { MCPConfig } from '~/lib/services/mcpService';
import { toast } from 'react-toastify';
import { useMCPStore } from '~/lib/stores/mcp';
import McpServerList from '~/components/@settings/tabs/mcp/McpServerList';

/*
 * MCP 配置模板
 * Note: Server-side mcpService automatically adjusts 'npx' to 'npx.cmd' on Windows
 */
const MCP_CONFIG_TEMPLATES = {
  basic: {
    name: '基本範例（推薦）',
    description: '包含基本的 MCP server 範例配置 - 已驗證可用',
    config: {
      mcpServers: {
        everything: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-everything'],
        },
        deepwiki: {
          type: 'streamable-http',
          url: 'https://mcp.deepwiki.com/mcp',
        },
      },
    },
  },
  typescript: {
    name: 'TypeScript 官方伺服器',
    description: '所有可用的官方 TypeScript MCP servers（npm 套件）',
    config: {
      mcpServers: {
        everything: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-everything'],
        },
        filesystem: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
        },
        memory: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-memory'],
        },
        'sequential-thinking': {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
        },
      },
    },
  },
  python: {
    name: 'Python MCP 伺服器',
    description: '基於 Python 的官方 MCP servers（需要安裝 Python 和 uvx）',
    config: {
      mcpServers: {
        fetch: {
          type: 'stdio',
          command: 'uvx',
          args: ['mcp-server-fetch'],
        },
        git: {
          type: 'stdio',
          command: 'uvx',
          args: ['mcp-server-git', '--repository', process.cwd()],
        },
        time: {
          type: 'stdio',
          command: 'uvx',
          args: ['mcp-server-time'],
        },
      },
    },
  },
  community: {
    name: '社群伺服器',
    description: '來自社群的熱門 MCP servers（HTTP 型態）',
    config: {
      mcpServers: {
        deepwiki: {
          type: 'streamable-http',
          url: 'https://mcp.deepwiki.com/mcp',
        },
      },
    },
  },
  mixed: {
    name: '混合配置',
    description: '結合 TypeScript、Python 和社群伺服器（適合進階使用者）',
    config: {
      mcpServers: {
        // TypeScript servers (npm)
        everything: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-everything'],
        },
        filesystem: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
        },
        memory: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-memory'],
        },

        // Python servers (uvx)
        fetch: {
          type: 'stdio',
          command: 'uvx',
          args: ['mcp-server-fetch'],
        },
        git: {
          type: 'stdio',
          command: 'uvx',
          args: ['mcp-server-git', '--repository', process.cwd()],
        },

        // Community servers (HTTP)
        deepwiki: {
          type: 'streamable-http',
          url: 'https://mcp.deepwiki.com/mcp',
        },
      },
    },
  },
};

export default function McpTab() {
  const settings = useMCPStore((state) => state.settings);
  const isInitialized = useMCPStore((state) => state.isInitialized);
  const serverTools = useMCPStore((state) => state.serverTools);
  const initialize = useMCPStore((state) => state.initialize);
  const updateSettings = useMCPStore((state) => state.updateSettings);
  const checkServersAvailabilities = useMCPStore((state) => state.checkServersAvailabilities);

  const [isSaving, setIsSaving] = useState(false);
  const [mcpConfigText, setMCPConfigText] = useState('');
  const [maxLLMSteps, setMaxLLMSteps] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingServers, setIsCheckingServers] = useState(false);
  const [expandedServer, setExpandedServer] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('basic');

  useEffect(() => {
    if (!isInitialized) {
      initialize().catch((err) => {
        setError(`無法初始化 MCP 設定：${err instanceof Error ? err.message : String(err)}`);
        toast.error('無法載入 MCP 配置');
      });
    }
  }, [isInitialized]);

  useEffect(() => {
    setMCPConfigText(JSON.stringify(settings.mcpConfig, null, 2));
    setMaxLLMSteps(settings.maxLLMSteps);
    setError(null);
  }, [settings]);

  const parsedConfig = useMemo(() => {
    try {
      setError(null);
      return JSON.parse(mcpConfigText) as MCPConfig;
    } catch (e) {
      setError(`無效的 JSON 格式：${e instanceof Error ? e.message : String(e)}`);
      return null;
    }
  }, [mcpConfigText]);

  const handleMaxLLMCallChange = (value: string) => {
    setMaxLLMSteps(parseInt(value, 10));
  };

  const handleSave = async () => {
    if (!parsedConfig) {
      return;
    }

    setIsSaving(true);

    try {
      await updateSettings({
        mcpConfig: parsedConfig,
        maxLLMSteps,
      });
      toast.success('MCP 配置已儲存');

      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '無法儲存配置');
      toast.error('無法儲存 MCP 配置');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadTemplate = (templateKey: string) => {
    const template = MCP_CONFIG_TEMPLATES[templateKey as keyof typeof MCP_CONFIG_TEMPLATES];

    if (template) {
      setMCPConfigText(JSON.stringify(template.config, null, 2));
      setSelectedTemplate(templateKey);
      setError(null);
      toast.success(`已載入「${template.name}」模板`);
    }
  };

  const checkServerAvailability = async () => {
    if (serverEntries.length === 0) {
      return;
    }

    setIsCheckingServers(true);
    setError(null);

    try {
      await checkServersAvailabilities();
    } catch (e) {
      setError(`無法檢查伺服器可用性：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsCheckingServers(false);
    }
  };

  const toggleServerExpanded = (serverName: string) => {
    setExpandedServer(expandedServer === serverName ? null : serverName);
  };

  const serverEntries = useMemo(() => Object.entries(serverTools), [serverTools]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <section aria-labelledby="server-status-heading">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-medium text-bolt-elements-textPrimary">已配置的 MCP 伺服器</h2>{' '}
          <button
            onClick={checkServerAvailability}
            disabled={isCheckingServers || !parsedConfig || serverEntries.length === 0}
            className={classNames(
              'px-3 py-1.5 rounded-lg text-sm',
              'bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-background-depth-4',
              'text-bolt-elements-textPrimary',
              'transition-all duration-200',
              'flex items-center gap-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            {isCheckingServers ? (
              <div className="i-svg-spinners:90-ring-with-bg w-3 h-3 text-bolt-elements-loader-progress animate-spin" />
            ) : (
              <div className="i-ph:arrow-counter-clockwise w-3 h-3" />
            )}
            檢查可用性
          </button>
        </div>
        <McpServerList
          checkingServers={isCheckingServers}
          expandedServer={expandedServer}
          serverEntries={serverEntries}
          toggleServerExpanded={toggleServerExpanded}
        />
      </section>

      <section aria-labelledby="config-section-heading">
        <h2 className="text-base font-medium text-bolt-elements-textPrimary mb-3">配置</h2>

        <div className="space-y-4">
          {/* 模板選擇器 */}
          <div>
            <label htmlFor="template-selector" className="block text-sm text-bolt-elements-textSecondary mb-2">
              快速載入模板
            </label>
            <select
              id="template-selector"
              value={selectedTemplate}
              onChange={(e) => handleLoadTemplate(e.target.value)}
              className={classNames(
                'w-full px-3 py-2 rounded-lg text-sm',
                'bg-white dark:bg-bolt-elements-background-depth-4',
                'border border-bolt-elements-borderColor dark:border-bolt-elements-borderColor-dark',
                'text-bolt-elements-textPrimary',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
              )}
            >
              {Object.entries(MCP_CONFIG_TEMPLATES).map(([key, template]) => (
                <option key={key} value={key}>
                  {template.name} - {template.description}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-bolt-elements-textTertiary">
              選擇預設模板快速開始，或手動編輯下方的 JSON 配置
            </p>
          </div>
          <div>
            <label htmlFor="mcp-config" className="block text-sm text-bolt-elements-textSecondary mb-2">
              配置 JSON
            </label>
            <textarea
              id="mcp-config"
              value={mcpConfigText}
              onChange={(e) => setMCPConfigText(e.target.value)}
              className={classNames(
                'w-full px-3 py-2 rounded-lg text-sm font-mono h-72',
                'bg-[#F8F8F8] dark:bg-[#1A1A1A]',
                'border',
                error ? 'border-bolt-elements-icon-error' : 'border-[#E5E5E5] dark:border-[#333333]',
                'text-bolt-elements-textPrimary',
                'focus:outline-none focus:ring-1 focus:ring-bolt-elements-focus',
              )}
            />
          </div>
          <div>{error && <p className="mt-2 mb-2 text-sm text-bolt-elements-icon-error">{error}</p>}</div>
          <div>
            <label htmlFor="max-llm-steps" className="block text-sm text-bolt-elements-textSecondary mb-2">
              LLM 連續呼叫的最大次數（步驟）
            </label>
            <input
              id="max-llm-steps"
              type="number"
              placeholder="LLM 連續呼叫的最大次數"
              min="1"
              max="20"
              value={maxLLMSteps}
              onChange={(e) => handleMaxLLMCallChange(e.target.value)}
              className="w-full px-3 py-2 text-bolt-elements-textPrimary text-sm rounded-lg bg-white dark:bg-bolt-elements-background-depth-4 border border-bolt-elements-borderColor dark:border-bolt-elements-borderColor-dark focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mt-2 text-sm text-bolt-elements-textSecondary">
            MCP 配置格式與 Claude Desktop 使用的格式相同。
            <a
              href="https://modelcontextprotocol.io/examples"
              target="_blank"
              rel="noopener noreferrer"
              className="text-bolt-elements-link hover:underline inline-flex items-center gap-1"
            >
              查看範例伺服器
              <div className="i-ph:arrow-square-out w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* MCP Servers 說明文檔 */}
      <section aria-labelledby="mcp-docs-heading" className="mt-6">
        <details className="group">
          <summary className="cursor-pointer list-none">
            <div className="flex items-center gap-2 text-bolt-elements-textPrimary hover:text-bolt-elements-textSecondary transition-colors">
              <div className="i-ph:book-open w-4 h-4" />
              <h3 className="text-sm font-medium">MCP Servers 說明文檔</h3>
              <div className="i-ph:caret-down w-4 h-4 group-open:rotate-180 transition-transform" />
            </div>
          </summary>
          <div className="mt-3 p-4 rounded-lg bg-bolt-elements-background-depth-2 text-sm space-y-3">
            {/* TypeScript (npm) Servers */}
            <div className="space-y-2">
              <h4 className="font-medium text-bolt-elements-textPrimary flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs rounded bg-blue-500/20 text-blue-600 dark:text-blue-400">
                  TypeScript
                </span>
                官方 npm 伺服器（可直接使用）
              </h4>
              <ul className="space-y-1.5 text-bolt-elements-textSecondary pl-4">
                <li>
                  <strong>everything:</strong> 測試伺服器，包含所有 MCP 協議功能範例
                </li>
                <li>
                  <strong>filesystem:</strong> 提供安全的檔案系統操作，可配置存取控制
                </li>
                <li>
                  <strong>memory:</strong> 基於知識圖譜的持久記憶系統，可儲存對話歷史
                </li>
                <li>
                  <strong>sequential-thinking:</strong> 動態反思性問題解決，增強推理能力
                </li>
              </ul>
            </div>

            {/* Python Servers */}
            <div className="space-y-2">
              <h4 className="font-medium text-bolt-elements-textPrimary flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs rounded bg-green-500/20 text-green-600 dark:text-green-400">
                  Python
                </span>
                官方 Python 伺服器（需要 Python 環境）
              </h4>
              <ul className="space-y-1.5 text-bolt-elements-textSecondary pl-4">
                <li>
                  <strong>fetch:</strong> 擷取網頁內容並轉換為 LLM 可用的 Markdown 格式
                </li>
                <li>
                  <strong>git:</strong> 讀取、搜尋和操作 Git 倉庫
                </li>
                <li>
                  <strong>time:</strong> 時間與時區轉換功能，支援 IANA 時區
                </li>
              </ul>
              <p className="text-xs text-bolt-elements-textTertiary italic pl-4">
                ℹ️ 需要安裝 Python 和 uvx（
                <code className="px-1 py-0.5 rounded bg-bolt-elements-background-depth-3">pip install uv</code>）
              </p>
            </div>

            {/* Community HTTP Servers */}
            <div className="space-y-2">
              <h4 className="font-medium text-bolt-elements-textPrimary flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs rounded bg-purple-500/20 text-purple-600 dark:text-purple-400">
                  HTTP
                </span>
                社群伺服器（無需安裝）
              </h4>
              <ul className="space-y-1.5 text-bolt-elements-textSecondary pl-4">
                <li>
                  <strong>deepwiki:</strong> 深度 Wiki 搜尋與知識查詢服務
                </li>
              </ul>
            </div>

            {/* Tips */}
            <div className="pt-2 border-t border-bolt-elements-borderColor space-y-2">
              <p className="text-xs text-bolt-elements-textTertiary">
                💡 <strong>TypeScript 伺服器</strong>：使用{' '}
                <code className="px-1 py-0.5 rounded bg-bolt-elements-background-depth-3">npx</code> 啟動，會自動安裝
              </p>
              <p className="text-xs text-bolt-elements-textTertiary">
                🐍 <strong>Python 伺服器</strong>：使用{' '}
                <code className="px-1 py-0.5 rounded bg-bolt-elements-background-depth-3">uvx</code> 啟動，需要 Python
                3.8+
              </p>
              <p className="text-xs text-bolt-elements-textTertiary">
                🌐 <strong>HTTP 伺服器</strong>：通過 URL 連接，無需本地安裝任何工具
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                ⚠️ <strong>注意</strong>：已測試的伺服器為 TypeScript 和 HTTP 類型。Python 伺服器需要額外配置 Python
                環境。
              </p>
            </div>
          </div>
        </details>
      </section>

      <div className="flex flex-wrap justify-end gap-3 mt-6">
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving || !parsedConfig}
            aria-disabled={isSaving || !parsedConfig}
            className={classNames(
              'px-4 py-2 rounded-lg text-sm flex items-center gap-2',
              'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent',
              'hover:bg-bolt-elements-item-backgroundActive',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            <div className="i-ph:floppy-disk w-4 h-4" />
            {isSaving ? '儲存中...' : '儲存配置'}
          </button>
        </div>
      </div>
    </div>
  );
}
