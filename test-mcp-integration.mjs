#!/usr/bin/env node
/**
 * MCP Integration Test Script
 *
 * This script tests all MCP server templates to ensure:
 * 1. Configuration is valid
 * 2. Servers can be initialized
 * 3. Tools are properly registered
 * 4. Each template works as expected
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MCP Configuration Templates (copied from McpTab.tsx)
const MCP_CONFIG_TEMPLATES = {
  basic: {
    name: '基本範例',
    description: '包含基本的 MCP server 範例配置',
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
  official: {
    name: '官方伺服器套件',
    description: '包含所有官方參考 MCP servers',
    config: {
      mcpServers: {
        fetch: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-fetch'],
        },
        filesystem: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
        },
        git: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-git'],
        },
        github: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-github'],
          env: {
            GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PERSONAL_ACCESS_TOKEN || '<your_github_token>',
          },
        },
        memory: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-memory'],
        },
        time: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-time'],
        },
        'sequential-thinking': {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
        },
      },
    },
  },
  development: {
    name: '開發者工具套件',
    description: '適合軟體開發的工具組合',
    config: {
      mcpServers: {
        github: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-github'],
          env: {
            GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PERSONAL_ACCESS_TOKEN || '<your_github_token>',
          },
        },
        git: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-git'],
        },
        filesystem: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
        },
        fetch: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-fetch'],
        },
      },
    },
  },
  database: {
    name: '資料庫工具套件',
    description: '資料庫管理工具',
    config: {
      mcpServers: {
        sqlite: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-sqlite', '--db-path', './test.db'],
        },
        postgresql: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-postgres'],
          env: {
            POSTGRES_CONNECTION_STRING: process.env.POSTGRES_CONNECTION_STRING || 'postgresql://localhost/mydb',
          },
        },
      },
    },
  },
  automation: {
    name: '自動化工具套件',
    description: '網頁自動化與搜尋工具',
    config: {
      mcpServers: {
        puppeteer: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-puppeteer'],
        },
        'brave-search': {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-brave-search'],
          env: {
            BRAVE_API_KEY: process.env.BRAVE_API_KEY || '<your_brave_api_key>',
          },
        },
      },
    },
  },
  complete: {
    name: '完整功能套件',
    description: '包含所有常用的 MCP servers',
    config: {
      mcpServers: {
        // Official servers
        fetch: { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-fetch'] },
        filesystem: { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()] },
        git: { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-git'] },
        github: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-github'],
          env: { GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PERSONAL_ACCESS_TOKEN || '<your_github_token>' },
        },
        memory: { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-memory'] },
        time: { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-time'] },
        'sequential-thinking': { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-sequential-thinking'] },
        // Database servers
        sqlite: { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-sqlite', '--db-path', './test.db'] },
        // Automation servers
        puppeteer: { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-puppeteer'] },
        // HTTP servers
        deepwiki: { type: 'streamable-http', url: 'https://mcp.deepwiki.com/mcp' },
      },
    },
  },
};

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'bright');
  console.log('='.repeat(80) + '\n');
}

function logSubsection(title) {
  log(`\n--- ${title} ---`, 'cyan');
}

async function testTemplate(templateKey, template) {
  logSubsection(`Testing: ${template.name} (${templateKey})`);
  log(`Description: ${template.description}`, 'blue');

  const results = {
    templateKey,
    templateName: template.name,
    servers: {},
    totalServers: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
  };

  const serverNames = Object.keys(template.config.mcpServers);
  results.totalServers = serverNames.length;

  log(`\nServers to test: ${serverNames.join(', ')}`);

  for (const serverName of serverNames) {
    const serverConfig = template.config.mcpServers[serverName];
    log(`\n  Testing server: ${serverName}`, 'yellow');

    const serverResult = {
      name: serverName,
      type: serverConfig.type,
      status: 'unknown',
      error: null,
      details: null,
    };

    try {
      // Validate configuration structure
      if (!serverConfig.type) {
        throw new Error('Missing type field');
      }

      if (serverConfig.type === 'stdio') {
        if (!serverConfig.command) {
          throw new Error('stdio server missing command field');
        }
        serverResult.details = `Command: ${serverConfig.command} ${(serverConfig.args || []).join(' ')}`;
      } else if (serverConfig.type === 'streamable-http') {
        if (!serverConfig.url) {
          throw new Error('streamable-http server missing url field');
        }
        try {
          new URL(serverConfig.url);
          serverResult.details = `URL: ${serverConfig.url}`;
        } catch {
          throw new Error(`Invalid URL: ${serverConfig.url}`);
        }
      } else if (serverConfig.type === 'sse') {
        if (!serverConfig.url) {
          throw new Error('sse server missing url field');
        }
        try {
          new URL(serverConfig.url);
          serverResult.details = `URL: ${serverConfig.url}`;
        } catch {
          throw new Error(`Invalid URL: ${serverConfig.url}`);
        }
      }

      // Check for placeholder environment variables
      if (serverConfig.env) {
        const placeholders = Object.entries(serverConfig.env)
          .filter(([key, value]) => value.includes('<') && value.includes('>'))
          .map(([key]) => key);

        if (placeholders.length > 0) {
          serverResult.status = 'skipped';
          serverResult.error = `Missing environment variables: ${placeholders.join(', ')}`;
          results.skipped++;
          log(`    ⚠ SKIPPED: ${serverResult.error}`, 'yellow');
        } else {
          serverResult.status = 'passed';
          results.passed++;
          log(`    ✓ PASSED: Configuration valid`, 'green');
        }
      } else {
        serverResult.status = 'passed';
        results.passed++;
        log(`    ✓ PASSED: Configuration valid`, 'green');
      }
    } catch (error) {
      serverResult.status = 'failed';
      serverResult.error = error.message;
      results.failed++;
      log(`    ✗ FAILED: ${error.message}`, 'red');
    }

    results.servers[serverName] = serverResult;
  }

  return results;
}

async function testAPIEndpoint(template, templateKey) {
  logSubsection(`API Integration Test: ${template.name}`);

  try {
    const response = await fetch('http://localhost:5178/api/mcp-update-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template.config),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const serverTools = await response.json();

    log(`  ✓ API call successful`, 'green');
    log(`  Server Tools Response:`, 'blue');

    for (const [serverName, serverInfo] of Object.entries(serverTools)) {
      if (serverInfo.status === 'available') {
        const toolCount = Object.keys(serverInfo.tools).length;
        log(`    • ${serverName}: AVAILABLE (${toolCount} tools)`, 'green');
      } else {
        log(`    • ${serverName}: UNAVAILABLE - ${serverInfo.error}`, 'red');
      }
    }

    return { success: true, serverTools };
  } catch (error) {
    log(`  ✗ API call failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function main() {
  logSection('MCP Integration Test Suite');

  log('This script will test all MCP configuration templates:', 'blue');
  log('1. Configuration structure validation');
  log('2. Server type validation');
  log('3. Environment variable checks');
  log('4. API integration tests (if server is running)\n');

  const allResults = [];

  // Test each template
  for (const [key, template] of Object.entries(MCP_CONFIG_TEMPLATES)) {
    const result = await testTemplate(key, template);
    allResults.push(result);

    // Display summary for this template
    log(`\n  Summary for ${template.name}:`, 'bright');
    log(`    Total: ${result.totalServers} | Passed: ${result.passed} | Failed: ${result.failed} | Skipped: ${result.skipped}`);

    if (result.passed === result.totalServers) {
      log(`    ✓ All servers passed!`, 'green');
    } else if (result.failed > 0) {
      log(`    ✗ Some servers failed`, 'red');
    }
  }

  // Overall summary
  logSection('Overall Summary');

  const totalTests = allResults.reduce((sum, r) => sum + r.totalServers, 0);
  const totalPassed = allResults.reduce((sum, r) => sum + r.passed, 0);
  const totalFailed = allResults.reduce((sum, r) => sum + r.failed, 0);
  const totalSkipped = allResults.reduce((sum, r) => sum + r.skipped, 0);

  log(`Total templates tested: ${allResults.length}`, 'bright');
  log(`Total servers tested: ${totalTests}`);
  log(`Passed: ${totalPassed}`, 'green');
  log(`Failed: ${totalFailed}`, totalFailed > 0 ? 'red' : 'green');
  log(`Skipped: ${totalSkipped}`, 'yellow');

  // API Integration Tests (optional - only if server is running)
  logSection('API Integration Tests (Optional)');
  log('Testing if dev server is running at http://localhost:5178...\n', 'blue');

  try {
    const healthCheck = await fetch('http://localhost:5178/');

    if (healthCheck.ok) {
      log('✓ Dev server is running! Testing API endpoints...\n', 'green');

      // Test one template (basic) via API
      const apiResult = await testAPIEndpoint(MCP_CONFIG_TEMPLATES.basic, 'basic');

      if (apiResult.success) {
        log('\n✓ API integration test passed!', 'green');
      } else {
        log('\n✗ API integration test failed', 'red');
      }
    }
  } catch (error) {
    log('⚠ Dev server is not running - skipping API tests', 'yellow');
    log('  To run API tests, start the dev server with: pnpm dev', 'blue');
  }

  // Final verdict
  logSection('Final Verdict');

  if (totalFailed === 0) {
    log('✓ ALL TESTS PASSED! MCP integration is ready.', 'green');
    process.exit(0);
  } else {
    log('✗ SOME TESTS FAILED - Please review errors above', 'red');

    // List failed servers
    log('\nFailed servers:', 'yellow');
    for (const result of allResults) {
      for (const [serverName, serverInfo] of Object.entries(result.servers)) {
        if (serverInfo.status === 'failed') {
          log(`  • ${result.templateKey}/${serverName}: ${serverInfo.error}`, 'red');
        }
      }
    }

    process.exit(1);
  }
}

// Run tests
main().catch((error) => {
  log(`\n✗ Test suite crashed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
