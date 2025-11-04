// 直接測試 Azure Responses API
import fetch from 'node-fetch';

const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;

if (!AZURE_OPENAI_API_KEY || !AZURE_OPENAI_ENDPOINT) {
  console.error('請設定 AZURE_OPENAI_API_KEY 和 AZURE_OPENAI_ENDPOINT 環境變數');
  process.exit(1);
}

console.log('測試 Azure Responses API...');
console.log('Endpoint:', AZURE_OPENAI_ENDPOINT);
console.log('Model: gpt-5-codex');

const controller = new AbortController();
const timeout = setTimeout(() => {
  console.log('\n⏱️  60 秒後手動中止...');
  controller.abort();
}, 60000);

try {
  const startTime = Date.now();
  console.log('\n發送請求...');

  const response = await fetch(`${AZURE_OPENAI_ENDPOINT}/responses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': AZURE_OPENAI_API_KEY,
    },
    body: JSON.stringify({
      model: 'gpt-5-codex',
      input: [
        {
          role: 'user',
          content: 'Write a simple hello world function in JavaScript'
        }
      ],
      stream: true,
      max_output_tokens: 1000,  // Responses API uses max_output_tokens, not max_completion_tokens
      temperature: 1
    }),
    signal: controller.signal,
  });

  console.log(`\n✅ 收到回應！耗時: ${Date.now() - startTime}ms`);
  console.log('狀態碼:', response.status);
  console.log('Headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorText = await response.text();
    console.error('\n❌ 錯誤回應:', errorText);
    process.exit(1);
  }

  console.log('\n開始接收串流數據...\n');

  let firstChunkTime = null;
  let chunkCount = 0;

  const reader = response.body;
  reader.setEncoding('utf8');

  for await (const chunk of reader) {
    if (!firstChunkTime) {
      firstChunkTime = Date.now();
      console.log(`⚡ 收到第一個數據塊！耗時: ${firstChunkTime - startTime}ms`);
    }
    chunkCount++;
    process.stdout.write('.');

    // 解析 SSE 數據
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data !== '[DONE]') {
          try {
            const json = JSON.parse(data);
            if (json.choices?.[0]?.delta?.content) {
              process.stdout.write(json.choices[0].delta.content);
            }
          } catch (e) {
            // 忽略解析錯誤
          }
        }
      }
    }
  }

  clearTimeout(timeout);

  console.log(`\n\n✅ 串流完成！`);
  console.log(`總耗時: ${Date.now() - startTime}ms`);
  console.log(`數據塊數量: ${chunkCount}`);
  console.log(`首次回應時間: ${firstChunkTime - startTime}ms`);

} catch (error) {
  clearTimeout(timeout);

  if (error.name === 'AbortError') {
    console.error('\n❌ 請求超時（60秒）');
  } else {
    console.error('\n❌ 錯誤:', error.message);
    console.error('詳細資訊:', error);
  }
  process.exit(1);
}
