import type { TabType } from './types';
import i18next from 'i18next';

export function getTabLabel(tabId: TabType): string {
  const keyMap: Record<TabType, string> = {
    profile: 'tabs.profile',
    settings: 'tabs.settings',
    notifications: 'tabs.notifications',
    features: 'tabs.features',
    data: 'tabs.data',
    'cloud-providers': 'tabs.cloudProviders',
    'local-providers': 'tabs.localProviders',
    github: 'tabs.github',
    gitlab: 'tabs.gitlab',
    netlify: 'tabs.netlify',
    vercel: 'tabs.vercel',
    supabase: 'tabs.supabase',
    'event-logs': 'tabs.eventLogs',
    mcp: 'tabs.mcp',
  };

  return i18next.t(keyMap[tabId], { ns: 'settings' });
}

export function getTabDescription(tabId: TabType): string {
  const keyMap: Record<TabType, string> = {
    profile: 'tabDescriptions.profile',
    settings: 'tabDescriptions.settings',
    notifications: 'tabDescriptions.notifications',
    features: 'tabDescriptions.features',
    data: 'tabDescriptions.data',
    'cloud-providers': 'tabDescriptions.cloudProviders',
    'local-providers': 'tabDescriptions.localProviders',
    github: 'tabDescriptions.github',
    gitlab: 'tabDescriptions.gitlab',
    netlify: 'tabDescriptions.netlify',
    vercel: 'tabDescriptions.vercel',
    supabase: 'tabDescriptions.supabase',
    'event-logs': 'tabDescriptions.eventLogs',
    mcp: 'tabDescriptions.mcp',
  };

  return i18next.t(keyMap[tabId], { ns: 'settings' });
}

/*
 * For backwards compatibility, keep the old constants
 * but now they will use the translation functions
 */
export const TAB_LABELS: Record<TabType, string> = new Proxy({} as Record<TabType, string>, {
  get: (_target, prop: string) => getTabLabel(prop as TabType),
});

export const TAB_DESCRIPTIONS: Record<TabType, string> = new Proxy({} as Record<TabType, string>, {
  get: (_target, prop: string) => getTabDescription(prop as TabType),
});
