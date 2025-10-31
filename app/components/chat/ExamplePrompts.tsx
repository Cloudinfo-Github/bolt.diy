import React from 'react';

const EXAMPLE_PROMPTS = [
  { text: '建立一個關於 bolt.diy 的行動應用程式' },
  { text: '使用 React 和 Tailwind 建立待辦事項應用' },
  { text: '使用 Astro 建立簡單的部落格' },
  { text: '使用 Material UI 建立 Cookie 同意表單' },
  { text: '製作太空侵略者遊戲' },
  { text: '僅使用 HTML、CSS 和 JS 製作井字遊戲' },
];

export function ExamplePrompts(sendMessage?: { (event: React.UIEvent, messageInput?: string): void | undefined }) {
  return (
    <div id="examples" className="relative flex flex-col gap-9 w-full max-w-3xl mx-auto flex justify-center mt-6">
      <div
        className="flex flex-wrap justify-center gap-2"
        style={{
          animation: '.25s ease-out 0s 1 _fade-and-move-in_g2ptj_1 forwards',
        }}
      >
        {EXAMPLE_PROMPTS.map((examplePrompt, index: number) => {
          return (
            <button
              key={index}
              onClick={(event) => {
                sendMessage?.(event, examplePrompt.text);
              }}
              className="border border-bolt-elements-borderColor rounded-full bg-gray-50 hover:bg-gray-100 dark:bg-gray-950 dark:hover:bg-gray-900 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary px-3 py-1 text-xs transition-theme"
            >
              {examplePrompt.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
