import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 讀取 .env.local
const envPath = join(__dirname, '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const AZURE_API_KEY = envVars.AZURE_OPENAI_API_KEY;
const AZURE_ENDPOINT = envVars.AZURE_OPENAI_ENDPOINT;

console.log('🧪 測試 Bolt 的對話、記憶和摘要功能');
console.log('='.repeat(50));

// 測試對話 API
async function testChat(messages, testName) {
  console.log(`\n📝 測試: ${testName}`);
  console.log('-'.repeat(50));

  const response = await fetch('http://localhost:5180/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      model: 'gpt-5-codex',
      provider: {
        name: 'AzureOpenAI',
      },
      apiKeys: {
        AzureOpenAI: AZURE_API_KEY,
      },
      providerSettings: {
        AzureOpenAI: {
          baseUrl: AZURE_ENDPOINT,
        },
      },
    }),
  });

  if (!response.ok) {
    console.error(`❌ 請求失敗: ${response.status} ${response.statusText}`);
    const text = await response.text();
    console.error('錯誤內容:', text);
    return null;
  }

  console.log('✅ 收到回應');

  // 讀取串流回應
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';
  let annotations = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('0:')) {
        const data = line.substring(2);
        fullResponse += data;
      } else if (line.startsWith('8:')) {
        // Annotation data
        try {
          const annotationJson = line.substring(2);
          const annotation = JSON.parse(annotationJson);
          annotations.push(annotation);
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }

  console.log('📄 AI 回應:', fullResponse.substring(0, 200) + (fullResponse.length > 200 ? '...' : ''));
  console.log('📊 回應長度:', fullResponse.length, '字元');

  // 檢查是否有摘要 annotation
  const summaryAnnotation = annotations.find(a => a[0] === 'chatSummary');
  if (summaryAnnotation) {
    console.log('✅ 找到摘要 annotation');
    console.log('📝 摘要預覽:', summaryAnnotation[1].summary?.substring(0, 150) + '...');
  } else {
    console.log('ℹ️  沒有找到摘要 annotation（可能需要更多對話才會生成）');
  }

  return {
    content: fullResponse,
    annotations,
    hasSummary: !!summaryAnnotation,
  };
}

// 執行測試
async function runTests() {
  try {
    // 測試 1: 基本對話
    console.log('\n🎯 測試 1: 基本對話功能');
    console.log('='.repeat(50));
    const test1Result = await testChat([
      {
        role: 'user',
        content: '你好！我叫小明，我喜歡寫 Python 程式。請記住我的名字和喜好。',
      },
    ], '初次對話 - 自我介紹');

    if (!test1Result) {
      console.error('❌ 測試 1 失敗');
      return;
    }

    // 測試 2: 記憶功能
    console.log('\n🎯 測試 2: 短期記憶功能');
    console.log('='.repeat(50));
    const test2Result = await testChat([
      {
        role: 'user',
        content: '你好！我叫小明，我喜歡寫 Python 程式。請記住我的名字和喜好。',
      },
      {
        role: 'assistant',
        content: test1Result.content,
      },
      {
        role: 'user',
        content: '我的名字是什麼？我喜歡什麼程式語言？',
      },
    ], '測試 AI 是否記得上一輪對話');

    if (!test2Result) {
      console.error('❌ 測試 2 失敗');
      return;
    }

    // 檢查 AI 是否正確回憶
    const hasName = test2Result.content.includes('小明');
    const hasPython = test2Result.content.toLowerCase().includes('python');

    console.log('\n📊 記憶測試結果:');
    console.log(`  ${hasName ? '✅' : '❌'} AI 記得名字 (小明)`);
    console.log(`  ${hasPython ? '✅' : '❌'} AI 記得喜好 (Python)`);

    // 測試 3: 長對話測試（觸發摘要生成）
    console.log('\n🎯 測試 3: 摘要生成功能');
    console.log('='.repeat(50));
    console.log('ℹ️  進行多輪對話以觸發摘要生成...');

    let messages = [
      {
        role: 'user',
        content: '你好！我叫小明，我喜歡寫 Python 程式。',
      },
      {
        role: 'assistant',
        content: test1Result.content,
      },
      {
        role: 'user',
        content: '我最近在學習 FastAPI 框架，你能給我一些建議嗎？',
      },
    ];

    const test3Result = await testChat(messages, '第 3 輪對話 - FastAPI');

    if (test3Result) {
      messages.push({
        role: 'assistant',
        content: test3Result.content,
      });
      messages.push({
        role: 'user',
        content: '我還想學習 Django，兩者有什麼區別？',
      });

      const test4Result = await testChat(messages, '第 4 輪對話 - Django');

      // 總結測試結果
      console.log('\n' + '='.repeat(50));
      console.log('📊 測試總結');
      console.log('='.repeat(50));
      console.log('✅ 對話功能: 正常');
      console.log(`${hasName && hasPython ? '✅' : '❌'} 記憶功能: ${hasName && hasPython ? '正常 - AI 能記住對話內容' : '異常'}`);
      console.log(`${test4Result?.hasSummary ? '✅' : 'ℹ️ '} 摘要功能: ${test4Result?.hasSummary ? '正常 - 已生成摘要' : '需要更多對話輪數（Context Optimization 可能需要更長的對話才會觸發）'}`);
    }

  } catch (error) {
    console.error('\n❌ 測試過程中發生錯誤:', error);
  }
}

runTests();
