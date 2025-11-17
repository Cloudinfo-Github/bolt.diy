import fetch from 'node-fetch';
import { config } from 'dotenv';

// 載入 .env.local
config({ path: '.env.local' });

const AZURE_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_API_KEY = process.env.AZURE_OPENAI_API_KEY;

console.log('🔍 測試 Azure AI Foundry grok-4-fast-reasoning API');
console.log('📋 Endpoint:', AZURE_ENDPOINT);
console.log('🔑 API Key:', AZURE_API_KEY ? `${AZURE_API_KEY.substring(0, 8)}...` : 'Missing!');
console.log('');

if (!AZURE_ENDPOINT || !AZURE_API_KEY) {
  console.error('❌ 缺少 AZURE_OPENAI_ENDPOINT 或 AZURE_OPENAI_API_KEY');
  process.exit(1);
}

const url = `${AZURE_ENDPOINT}/chat/completions`;

const requestBody = {
  model: 'grok-2-latest',  // 改用非 reasoning 模型測試
  messages: [
    {
      role: 'user',
      content: 'Bolt 今天是星期幾？請簡短回答。'
    }
  ],
  stream: true,
  temperature: 1,
  max_completion_tokens: 100
};

console.log('📤 發送請求...');
console.log('URL:', url);
console.log('Body:', JSON.stringify(requestBody, null, 2));
console.log('');

try {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': AZURE_API_KEY
    },
    body: JSON.stringify(requestBody)
  });

  console.log('📥 收到回應');
  console.log('Status:', response.status, response.statusText);
  console.log('Headers:');
  response.headers.forEach((value, key) => {
    console.log(`  ${key}: ${value}`);
  });
  console.log('');

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ 請求失敗:');
    console.error(errorText);
    process.exit(1);
  }

  if (!response.body) {
    console.error('❌ 沒有回應 body');
    process.exit(1);
  }

  console.log('📖 開始讀取串流...');
  console.log('');

  let chunkCount = 0;
  let reasoningContent = '';
  let textContent = '';
  let buffer = '';

  // node-fetch 不支援 getReader()，使用 for await 循環
  for await (const chunk of response.body) {
    chunkCount++;
    const chunkText = chunk.toString();
    buffer += chunkText;

    // 解析 SSE 格式
    const lines = buffer.split('\n');
    const incompleteLine = lines.pop() || '';
    buffer = incompleteLine;

    for (const line of lines) {
      if (!line.trim() || line.startsWith(':')) {
        continue;
      }

      if (line.startsWith('data: ')) {
        const dataContent = line.substring(6).trim();

        if (dataContent === '[DONE]') {
          continue;
        }

        try {
          const data = JSON.parse(dataContent);

          // 提取 reasoning_content
          if (data.choices && data.choices[0]?.delta?.reasoning_content) {
            const reasoning = data.choices[0].delta.reasoning_content;
            reasoningContent += reasoning;
            console.log('💭 [Reasoning]:', reasoning.substring(0, 100));
          }

          // 提取普通文本內容
          if (data.choices && data.choices[0]?.delta?.content) {
            const text = data.choices[0].delta.content;
            textContent += text;
            process.stdout.write(text);
          }

          // 記錄其他事件類型
          if (data.type) {
            console.log('📋 [Event]:', data.type);
          }
        } catch (parseError) {
          // 忽略無法解析的行
        }
      }
    }
  }

  console.log('');
  console.log('');
  console.log('📊 統計:');
  console.log(`  Chunks: ${chunkCount}`);
  console.log(`  Reasoning 長度: ${reasoningContent.length}`);
  console.log(`  Text 長度: ${textContent.length}`);
  console.log('');

  if (reasoningContent) {
    console.log('💭 完整 Reasoning:');
    console.log(reasoningContent);
    console.log('');
  }

  if (textContent) {
    console.log('💬 完整回應:');
    console.log(textContent);
  }

  console.log('');
  console.log('✅ 測試成功！');

} catch (error) {
  console.error('❌ 錯誤:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
