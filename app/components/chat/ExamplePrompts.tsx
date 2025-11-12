import React from 'react';
import { useI18n } from '~/i18n/hooks/useI18n';

interface ExamplePromptsProps {
  sendMessage?: (event: React.UIEvent, messageInput?: string) => void | undefined;
}

export function ExamplePrompts({ sendMessage }: ExamplePromptsProps) {
  const { t } = useI18n('chat');
  const examplePrompts = (t('examples.prompts', { returnObjects: true }) as string[]) || [];

  return (
    <div id="examples" className="relative flex flex-col gap-9 w-full max-w-3xl mx-auto flex justify-center mt-6">
      <div
        className="flex flex-wrap justify-center gap-2"
        style={{
          animation: '.25s ease-out 0s 1 _fade-and-move-in_g2ptj_1 forwards',
        }}
      >
        {examplePrompts.map((promptText: string, index: number) => {
          return (
            <button
              key={index}
              onClick={(event) => {
                sendMessage?.(event, promptText);
              }}
              className="border border-bolt-elements-borderColor rounded-full bg-gray-50 hover:bg-gray-100 dark:bg-gray-950 dark:hover:bg-gray-900 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary px-3 py-1 text-xs transition-theme"
            >
              {promptText}
            </button>
          );
        })}
      </div>
    </div>
  );
}
