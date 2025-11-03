import { resolve } from 'node:path';
import { RemixI18Next } from 'remix-i18next/server';
import i18nextFsBackend from 'i18next-fs-backend';
import { defaultLanguage } from './config';

export const i18next = new RemixI18Next({
  detection: {
    supportedLanguages: ['en', 'zh-TW'],
    fallbackLanguage: defaultLanguage,
    cookie: {
      name: 'bolt_i18n',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    },
  },
  i18next: {
    backend: {
      loadPath: resolve('./public/locales/{{lng}}/{{ns}}.json'),
    },
  },
  plugins: [i18nextFsBackend],
});
