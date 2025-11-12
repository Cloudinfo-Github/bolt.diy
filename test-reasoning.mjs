import fetch from 'node-fetch';

const API_URL = 'http://localhost:5180/api/chat';

async function testReasoning() {
  console.log('發送複雜測試請求...');

  const requestBody = {
    messages: [
      {
        role: 'user',
        content: '請幫我分析一下這個複雜的算法問題：如何在 O(log n) 時間複雜度內實現一個高效的二分搜索樹？請詳細說明思路、實現步驟和優化方案。[model:gpt-5-codex][provider:AzureOpenAI]'
      }
    ]
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('響應狀態:', response.status);

    const reader = response.body;
    let buffer = '';
    let reasoningFound = false;

    for await (const chunk of reader) {
      buffer += chunk.toString();
      
      // 檢查是否包含推理內容
      if (buffer.includes('reasoning') || buffer.includes('Reasoning')) {
        reasoningFound = true;
      }
    }

    console.log('\n===== 是否找到推理內容 =====');
    console.log(reasoningFound ? '✅ 找到推理內容' : '❌ 未找到推理內容');
    
    console.log('\n===== Buffer 前 1000 字符 =====');
    console.log(buffer.substring(0, 1000));
  } catch (error) {
    console.error('請求失敗:', error.message);
  }
}

testReasoning();
