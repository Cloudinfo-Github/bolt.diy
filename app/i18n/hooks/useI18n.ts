import { useTranslation as useI18nTranslation } from 'react-i18next';
import type { SupportedNamespace } from '~/i18n/config';

export function useI18n(namespace: SupportedNamespace | SupportedNamespace[] = 'common') {
  const { t, i18n } = useI18nTranslation(namespace);

  return {
    t,
    i18n,
    language: i18n.language,
    changeLanguage: i18n.changeLanguage,
    isReady: i18n.isInitialized,
  };
}

export { useTranslation } from 'react-i18next';
