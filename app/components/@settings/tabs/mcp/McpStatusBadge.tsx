import { useMemo } from 'react';
import { useI18n } from '~/i18n/hooks/useI18n';

export default function McpStatusBadge({ status }: { status: 'checking' | 'available' | 'unavailable' }) {
  const { t } = useI18n('settings');
  const { styles, label, icon, ariaLabel } = useMemo(() => {
    const base = 'px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 transition-colors';

    const config = {
      checking: {
        styles: `${base} bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200`,
        label: t('mcp.status.checking'),
        ariaLabel: t('mcp.status.checkingAriaLabel'),
        icon: <span className="i-svg-spinners:90-ring-with-bg w-3 h-3 text-current animate-spin" aria-hidden="true" />,
      },
      available: {
        styles: `${base} bg-green-100 text-green-800 dark:bg-green-900/80 dark:text-green-200`,
        label: t('mcp.status.available'),
        ariaLabel: t('mcp.status.availableAriaLabel'),
        icon: <span className="i-ph:check-circle w-3 h-3 text-current" aria-hidden="true" />,
      },
      unavailable: {
        styles: `${base} bg-red-100 text-red-800 dark:bg-red-900/80 dark:text-red-200`,
        label: t('mcp.status.unavailable'),
        ariaLabel: t('mcp.status.unavailableAriaLabel'),
        icon: <span className="i-ph:warning-circle w-3 h-3 text-current" aria-hidden="true" />,
      },
    };

    return config[status];
  }, [status, t]);

  return (
    <span className={styles} role="status" aria-live="polite" aria-label={ariaLabel}>
      {icon}
      {label}
    </span>
  );
}
