/**
 * 完整系統整合測試腳本
 * 測試前後端整合、推理顯示、流式回覆等功能
 */

import http from 'http';

const BASE_URL = 'http://localhost:5173';

// 測試配置
const TEST_CONFIG = {
  // 簡單測試：使用 gpt-4o (不支援推理)
  simpleTest: {
    model: 'gpt-4o',
    message: 'Say "Hello from Bolt!" in one sentence.',
    description: '基本聊天功能測試 (gpt-4o)'
  },
  // 推理測試：使用 gpt-5-codex (支援推理)
  reasoningTest: {
    model: 'gpt-5-codex',
    message: 'Write a simple HTML page with a red button. Think step by step.',
    description: 'GPT-5-Codex 推理顯示測試'
  }
};

/**
 * 發送聊天請求並處理流式回應
 */
async function sendChatRequest(modelConfig) {
  return new Promise((resolve, reject) => {
    console.log('\n' + '='.repeat(60));
    console.log(`📝 測試: ${modelConfig.description}`);
    console.log(`🤖 模型: ${modelConfig.model}`);
    console.log(`💬 訊息: ${modelConfig.message}`);
    console.log('='.repeat(60));

    const requestBody = JSON.stringify({
      messages: [
        {
          role: 'user',
          content: modelConfig.message
        }
      ],
      model: modelConfig.model,
      provider: 'AzureOpenAI'  // 明確指定使用 Azure OpenAI provider
    });

    const options = {
      hostname: 'localhost',
      port: 5173,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const startTime = Date.now();
    let receivedData = '';
    let chunkCount = 0;
    let hasReasoningData = false;
    let hasTextData = false;
    let reasoningChunks = [];
    let textChunks = [];

    const req = http.request(options, (res) => {
      console.log(`\n📡 回應狀態碼: ${res.statusCode}`);
      console.log(`📋 Content-Type: ${res.headers['content-type']}`);

      if (res.statusCode !== 200) {
        let errorBody = '';
        res.on('data', (chunk) => {
          errorBody += chunk.toString();
        });
        res.on('end', () => {
          console.error(`❌ 請求失敗: ${errorBody}`);
          reject(new Error(`HTTP ${res.statusCode}: ${errorBody}`));
        });
        return;
      }

      res.on('data', (chunk) => {
        const chunkStr = chunk.toString();
        receivedData += chunkStr;
        chunkCount++;

        // 檢查是否包含推理數據
        if (chunkStr.includes('__boltThought__') || chunkStr.includes('reasoning')) {
          hasReasoningData = true;
          reasoningChunks.push(chunkStr);
        }

        // 檢查是否包含文本數據
        if (chunkStr.includes('0:') && !chunkStr.includes('__boltThought__')) {
          hasTextData = true;
          textChunks.push(chunkStr);
        }

        // 即時顯示接收到的數據片段
        if (chunkCount <= 5 || chunkCount % 10 === 0) {
          console.log(`\n📦 Chunk #${chunkCount} (${chunkStr.length} bytes):`);
          console.log(chunkStr.substring(0, 200) + (chunkStr.length > 200 ? '...' : ''));
        }
      });

      res.on('end', () => {
        const duration = Date.now() - startTime;

        console.log('\n' + '='.repeat(60));
        console.log('📊 測試結果統計');
        console.log('='.repeat(60));
        console.log(`⏱️  總耗時: ${duration}ms`);
        console.log(`📦 接收 chunks: ${chunkCount}`);
        console.log(`📏 總數據量: ${receivedData.length} bytes`);
        console.log(`🧠 包含推理數據: ${hasReasoningData ? '✅ 是' : '❌ 否'}`);
        console.log(`📝 包含文本數據: ${hasTextData ? '✅ 是' : '❌ 否'}`);

        if (hasReasoningData) {
          console.log(`🔢 推理 chunks: ${reasoningChunks.length}`);
        }
        if (hasTextData) {
          console.log(`🔢 文本 chunks: ${textChunks.length}`);
        }

        // 分析數據流結構
        console.log('\n📋 數據流分析:');
        const lines = receivedData.split('\n').filter(line => line.trim());
        console.log(`總行數: ${lines.length}`);

        // 檢查 __boltThought__ 標記
        const thoughtLines = lines.filter(line => line.includes('__boltThought__'));
        if (thoughtLines.length > 0) {
          console.log(`\n🧠 發現 ${thoughtLines.length} 個 __boltThought__ 標記`);
          console.log('前 3 個範例:');
          thoughtLines.slice(0, 3).forEach((line, i) => {
            console.log(`  ${i + 1}. ${line.substring(0, 150)}...`);
          });
        }

        // 提取實際內容
        console.log('\n📄 回應內容預覽:');
        try {
          // 嘗試解析 data stream
          let contentParts = [];
          let reasoningParts = [];

          lines.forEach(line => {
            if (line.startsWith('0:')) {
              const content = line.substring(2);
              if (content.includes('__boltThought__')) {
                reasoningParts.push(content);
              } else {
                contentParts.push(content);
              }
            }
          });

          if (reasoningParts.length > 0) {
            console.log(`\n🧠 推理內容 (${reasoningParts.length} 部分):`);
            console.log(reasoningParts.slice(0, 3).join('\n'));
          }

          if (contentParts.length > 0) {
            console.log(`\n💬 文本內容 (${contentParts.length} 部分):`);
            console.log(contentParts.slice(0, 5).join(''));
          }

        } catch (err) {
          console.log(`解析失敗: ${err.message}`);
        }

        console.log('\n' + '='.repeat(60));

        resolve({
          success: true,
          duration,
          chunkCount,
          dataSize: receivedData.length,
          hasReasoningData,
          hasTextData,
          reasoningChunks: reasoningChunks.length,
          textChunks: textChunks.length,
          rawData: receivedData
        });
      });
    });

    req.on('error', (err) => {
      console.error(`\n❌ 請求錯誤: ${err.message}`);
      reject(err);
    });

    req.on('timeout', () => {
      console.error('\n❌ 請求超時');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.setTimeout(180000); // 3 分鐘超時

    console.log('\n📤 發送請求...');
    req.write(requestBody);
    req.end();
  });
}

/**
 * 執行所有測試
 */
async function runAllTests() {
  console.log('\n🚀 開始執行完整系統測試');
  console.log('📍 伺服器: ' + BASE_URL);
  console.log('⏰ 開始時間: ' + new Date().toLocaleString());

  const results = {
    simpleTest: null,
    reasoningTest: null,
    errors: []
  };

  // 測試 1: 基本聊天功能
  try {
    console.log('\n\n🧪 測試 1/2: 基本聊天功能');
    results.simpleTest = await sendChatRequest(TEST_CONFIG.simpleTest);
  } catch (err) {
    console.error(`❌ 測試 1 失敗: ${err.message}`);
    results.errors.push({ test: 'simpleTest', error: err.message });
  }

  // 等待一下再執行下一個測試
  console.log('\n⏳ 等待 3 秒後執行下一個測試...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 測試 2: GPT-5-Codex 推理顯示
  try {
    console.log('\n\n🧪 測試 2/2: GPT-5-Codex 推理顯示');
    results.reasoningTest = await sendChatRequest(TEST_CONFIG.reasoningTest);
  } catch (err) {
    console.error(`❌ 測試 2 失敗: ${err.message}`);
    results.errors.push({ test: 'reasoningTest', error: err.message });
  }

  // 生成測試報告
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 完整測試報告');
  console.log('='.repeat(80));
  console.log(`⏰ 完成時間: ${new Date().toLocaleString()}\n`);

  // 測試 1 結果
  console.log('【測試 1】基本聊天功能 (gpt-4o)');
  if (results.simpleTest) {
    console.log(`  ✅ 狀態: 成功`);
    console.log(`  ⏱️  耗時: ${results.simpleTest.duration}ms`);
    console.log(`  📦 Chunks: ${results.simpleTest.chunkCount}`);
    console.log(`  📏 數據量: ${results.simpleTest.dataSize} bytes`);
    console.log(`  📝 文本數據: ${results.simpleTest.hasTextData ? '✅' : '❌'}`);
  } else {
    console.log(`  ❌ 狀態: 失敗`);
    const error = results.errors.find(e => e.test === 'simpleTest');
    if (error) {
      console.log(`  錯誤: ${error.error}`);
    }
  }

  // 測試 2 結果
  console.log('\n【測試 2】GPT-5-Codex 推理顯示');
  if (results.reasoningTest) {
    console.log(`  ✅ 狀態: 成功`);
    console.log(`  ⏱️  耗時: ${results.reasoningTest.duration}ms`);
    console.log(`  📦 Chunks: ${results.reasoningTest.chunkCount}`);
    console.log(`  📏 數據量: ${results.reasoningTest.dataSize} bytes`);
    console.log(`  🧠 推理數據: ${results.reasoningTest.hasReasoningData ? '✅' : '❌'}`);
    console.log(`  📝 文本數據: ${results.reasoningTest.hasTextData ? '✅' : '❌'}`);
    if (results.reasoningTest.hasReasoningData) {
      console.log(`  🔢 推理 Chunks: ${results.reasoningTest.reasoningChunks}`);
    }
  } else {
    console.log(`  ❌ 狀態: 失敗`);
    const error = results.errors.find(e => e.test === 'reasoningTest');
    if (error) {
      console.log(`  錯誤: ${error.error}`);
    }
  }

  // 關鍵問題檢查
  console.log('\n' + '='.repeat(80));
  console.log('🔍 關鍵問題檢查');
  console.log('='.repeat(80));

  const checks = [
    {
      name: '基本聊天功能是否正常',
      pass: results.simpleTest?.success && results.simpleTest?.hasTextData,
      details: results.simpleTest ? '回應正常' : '測試失敗'
    },
    {
      name: 'GPT-5-Codex 推理數據是否傳送',
      pass: results.reasoningTest?.hasReasoningData,
      details: results.reasoningTest?.hasReasoningData
        ? `成功接收 ${results.reasoningTest.reasoningChunks} 個推理 chunks`
        : '未檢測到推理數據'
    },
    {
      name: '前端是否能看到 __boltThought__ 標記',
      pass: results.reasoningTest?.hasReasoningData,
      details: results.reasoningTest?.hasReasoningData
        ? '數據流中包含 __boltThought__ 標記'
        : '數據流中缺少 __boltThought__ 標記'
    },
    {
      name: '是否有 timeout 問題',
      pass: results.reasoningTest?.duration < 180000,
      details: results.reasoningTest
        ? `回應時間 ${results.reasoningTest.duration}ms`
        : '測試未完成'
    },
    {
      name: '流式回覆是否正常',
      pass: (results.simpleTest?.chunkCount > 1) || (results.reasoningTest?.chunkCount > 1),
      details: `接收到多個 chunks (測試1: ${results.simpleTest?.chunkCount || 0}, 測試2: ${results.reasoningTest?.chunkCount || 0})`
    }
  ];

  checks.forEach((check, i) => {
    const icon = check.pass ? '✅' : '❌';
    console.log(`${i + 1}. ${icon} ${check.name}`);
    console.log(`   ${check.details}`);
  });

  const passCount = checks.filter(c => c.pass).length;
  const totalCount = checks.length;

  console.log('\n' + '='.repeat(80));
  console.log(`📈 總體結果: ${passCount}/${totalCount} 項檢查通過`);
  console.log('='.repeat(80));

  if (passCount === totalCount) {
    console.log('\n🎉 所有測試通過！系統運行正常。');
  } else {
    console.log('\n⚠️  部分測試失敗，請檢查上述問題。');
  }

  console.log('\n💡 提示: 您可以在瀏覽器中訪問 http://localhost:5173 進行手動測試');
  console.log('');

  return results;
}

// 執行測試
runAllTests()
  .then(() => {
    console.log('✅ 測試完成');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ 測試執行失敗:', err);
    process.exit(1);
  });
