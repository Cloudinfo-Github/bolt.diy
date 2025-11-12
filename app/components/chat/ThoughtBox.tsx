import { useState, type PropsWithChildren } from 'react';
import { useI18n } from '~/i18n/hooks/useI18n';

const ThoughtBox = ({ title, children }: PropsWithChildren<{ title?: string }>) => {
  const { t } = useI18n('chat');
  const [isExpanded, setIsExpanded] = useState(false);

  // 使用傳入的 title 或預設的 i18n 翻譯
  const displayTitle = title || t('reasoning.title');

  return (
    <div
      onClick={() => setIsExpanded(!isExpanded)}
      className={`
        bg-bolt-elements-background-depth-2
        shadow-md
        rounded-lg
        cursor-pointer
        transition-all
        duration-300
        ${isExpanded ? 'max-h-96' : 'max-h-13'}
        overflow-auto
        border border-bolt-elements-borderColor
      `}
    >
      <div className="p-4 flex items-center gap-4 rounded-lg  text-bolt-elements-textSecondary font-medium leading-5 text-sm  border border-bolt-elements-borderColor">
        <div className="i-ph:brain-thin text-2xl" />
        <div className="div">
          <span> {displayTitle}</span>{' '}
          {!isExpanded && <span className="text-bolt-elements-textTertiary"> - {t('reasoning.clickToExpand')}</span>}
        </div>
      </div>
      <div
        className={`
        transition-opacity
        duration-300
        p-4
        rounded-lg
        ${isExpanded ? 'opacity-100' : 'opacity-0'}
      `}
      >
        {children}
      </div>
    </div>
  );
};

export default ThoughtBox;
