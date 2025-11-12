import React from 'react';
import { Button } from '~/components/ui/Button';
import type { GitLabStats } from '~/types/GitLab';
import { useI18n } from '~/i18n/hooks/useI18n';

interface StatsDisplayProps {
  stats: GitLabStats;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function StatsDisplay({ stats, onRefresh, isRefreshing }: StatsDisplayProps) {
  const { t } = useI18n('integrations');

  return (
    <div className="space-y-4">
      {/* Repository Stats */}
      <div>
        <h5 className="text-sm font-medium text-bolt-elements-textPrimary mb-2">{t('gitlab.stats.totalRepos')}</h5>
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              label: t('gitlab.stats.publicRepos'),
              value: stats.publicProjects,
            },
            {
              label: t('gitlab.stats.privateRepos'),
              value: stats.privateProjects,
            },
          ].map((stat, index) => (
            <div
              key={index}
              className="flex flex-col p-3 rounded-lg bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor"
            >
              <span className="text-xs text-bolt-elements-textSecondary">{stat.label}</span>
              <span className="text-lg font-medium text-bolt-elements-textPrimary">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contribution Stats */}
      <div>
        <h5 className="text-sm font-medium text-bolt-elements-textPrimary mb-2">{t('gitlab.stats.contributors')}</h5>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: t('gitlab.stats.stars'),
              value: stats.stars || 0,
              icon: 'i-ph:star',
              iconColor: 'text-bolt-elements-icon-warning',
            },
            {
              label: t('gitlab.stats.forks'),
              value: stats.forks || 0,
              icon: 'i-ph:git-fork',
              iconColor: 'text-bolt-elements-icon-info',
            },
            {
              label: t('supabase.stats.totalUsers'),
              value: stats.followers || 0,
              icon: 'i-ph:users',
              iconColor: 'text-bolt-elements-icon-success',
            },
          ].map((stat, index) => (
            <div
              key={index}
              className="flex flex-col p-3 rounded-lg bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor"
            >
              <span className="text-xs text-bolt-elements-textSecondary">{stat.label}</span>
              <span className="text-lg font-medium text-bolt-elements-textPrimary flex items-center gap-1">
                <div className={`${stat.icon} w-4 h-4 ${stat.iconColor}`} />
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-bolt-elements-borderColor">
        <div className="flex items-center justify-between">
          <span className="text-xs text-bolt-elements-textSecondary">
            {t('gitlab.stats.lastUpdated')}: {new Date(stats.lastUpdated).toLocaleString()}
          </span>
          {onRefresh && (
            <Button onClick={onRefresh} disabled={isRefreshing} variant="outline" size="sm" className="text-xs">
              {isRefreshing ? t('shared.refreshing') : t('shared.refresh')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
