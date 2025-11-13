import { useI18n } from '~/i18n/hooks/useI18n';

export function BinaryContent() {
  const { t } = useI18n('editor');

  return (
    <div className="flex items-center justify-center absolute inset-0 z-10 text-sm bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary">
      {t('binary.cannotDisplay')}
    </div>
  );
}
