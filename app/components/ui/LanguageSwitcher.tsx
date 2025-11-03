import { memo, useState } from 'react';
import { useI18n } from '~/i18n/hooks/useI18n';
import { supportedLanguages, type SupportedLanguage } from '~/i18n/config';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { classNames } from '~/utils/classNames';

interface LanguageSwitcherProps {
  className?: string;
}

export const LanguageSwitcher = memo(({ className }: LanguageSwitcherProps) => {
  const { language, changeLanguage } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = (language as SupportedLanguage) || 'zh-TW';
  const currentLanguageInfo = supportedLanguages[currentLanguage];

  const handleLanguageChange = async (lng: SupportedLanguage) => {
    await changeLanguage(lng);
    setIsOpen(false);
  };

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          className={classNames(
            'flex items-center gap-2 px-3 py-2',
            'rounded-lg',
            'text-bolt-elements-textPrimary',
            'hover:bg-bolt-elements-background-depth-2',
            'transition-colors duration-200',
            'text-sm font-medium',
            className,
          )}
          title="切換語言 / Switch Language"
        >
          <span className="i-ph:translate text-lg" />
          <span>{currentLanguageInfo?.nativeName}</span>
          <span className="i-ph:caret-down text-sm" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={classNames(
            'min-w-[160px]',
            'bg-bolt-elements-background-depth-2',
            'border border-bolt-elements-borderColor',
            'rounded-lg shadow-lg',
            'py-1',
            'z-[9999]',
            'animate-in fade-in-0 zoom-in-95',
          )}
          sideOffset={5}
          align="end"
        >
          {Object.entries(supportedLanguages).map(([code, info]) => {
            const isActive = code === currentLanguage;
            return (
              <DropdownMenu.Item
                key={code}
                className={classNames(
                  'flex items-center gap-3 px-3 py-2',
                  'text-sm',
                  'cursor-pointer',
                  'transition-colors',
                  'outline-none',
                  isActive
                    ? 'bg-bolt-elements-item-backgroundActive text-bolt-elements-textPrimary font-medium'
                    : 'text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-3 hover:text-bolt-elements-textPrimary',
                )}
                onClick={() => handleLanguageChange(code as SupportedLanguage)}
              >
                {isActive && <span className="i-ph:check text-lg text-bolt-elements-item-contentAccent" />}
                {!isActive && <span className="w-5" />}
                <div className="flex flex-col">
                  <span>{info.nativeName}</span>
                  <span className="text-xs opacity-60">{info.name}</span>
                </div>
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
});

LanguageSwitcher.displayName = 'LanguageSwitcher';
