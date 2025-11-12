export const supportedLanguages = {
  en: { name: 'English', nativeName: 'English' },
  'zh-TW': { name: 'Traditional Chinese', nativeName: '繁體中文' },
} as const;

export type SupportedLanguage = keyof typeof supportedLanguages;

export const defaultLanguage: SupportedLanguage = 'zh-TW';

export const supportedNamespaces = [
  'common',
  'chat',
  'settings',
  'deploy',
  'repository',
  'file',
  'errors',
  'workbench',
  'providers',
] as const;

export type SupportedNamespace = (typeof supportedNamespaces)[number];

export const defaultNamespace: SupportedNamespace = 'common';
