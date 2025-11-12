import React from 'react';
import type { GitLabProjectInfo } from '~/types/GitLab';
import { useI18n } from '~/i18n/hooks/useI18n';

interface RepositoryCardProps {
  repo: GitLabProjectInfo;
  onClone?: (repo: GitLabProjectInfo) => void;
}

export function RepositoryCard({ repo, onClone }: RepositoryCardProps) {
  const { t } = useI18n('integrations');

  return (
    <a
      key={repo.name}
      href={repo.http_url_to_repo}
      target="_blank"
      rel="noopener noreferrer"
      className="group block p-4 rounded-lg bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor hover:border-bolt-elements-borderColorActive transition-all duration-200"
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="i-ph:git-repository w-4 h-4 text-bolt-elements-icon-info" />
            <h5 className="text-sm font-medium text-bolt-elements-textPrimary group-hover:text-bolt-elements-item-contentAccent transition-colors">
              {repo.name}
            </h5>
          </div>
          <div className="flex items-center gap-3 text-xs text-bolt-elements-textSecondary">
            <span className="flex items-center gap-1" title={t('gitlab.stats.stars')}>
              <div className="i-ph:star w-3.5 h-3.5 text-bolt-elements-icon-warning" />
              {repo.star_count.toLocaleString()}
            </span>
            <span className="flex items-center gap-1" title={t('gitlab.stats.forks')}>
              <div className="i-ph:git-fork w-3.5 h-3.5 text-bolt-elements-icon-info" />
              {repo.forks_count.toLocaleString()}
            </span>
          </div>
        </div>

        {repo.description && (
          <p className="text-xs text-bolt-elements-textSecondary line-clamp-2">{repo.description}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-bolt-elements-textSecondary">
          <span className="flex items-center gap-1" title={t('gitlab.repositories.defaultBranch')}>
            <div className="i-ph:git-branch w-3.5 h-3.5" />
            {repo.default_branch}
          </span>
          <span className="flex items-center gap-1" title={t('gitlab.repositories.lastActivity')}>
            <div className="i-ph:clock w-3.5 h-3.5" />
            {new Date(repo.updated_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
          <div className="flex items-center gap-2 ml-auto">
            {onClone && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClone(repo);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
                title={t('gitlab.actions.clone')}
              >
                <div className="i-ph:git-branch w-3.5 h-3.5" />
                {t('gitlab.actions.clone')}
              </button>
            )}
            <span className="flex items-center gap-1 group-hover:text-bolt-elements-item-contentAccent transition-colors">
              <div className="i-ph:arrow-square-out w-3.5 h-3.5" />
              {t('vercel.projects.view')}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
