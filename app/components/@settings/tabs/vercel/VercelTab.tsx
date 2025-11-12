import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useStore } from '@nanostores/react';
import { logStore } from '~/lib/stores/logs';
import type { VercelUserResponse } from '~/types/vercel';
import { classNames } from '~/utils/classNames';
import { Button } from '~/components/ui/Button';
import { ServiceHeader, ConnectionTestIndicator } from '~/components/@settings/shared/service-integration';
import { useConnectionTest } from '~/lib/hooks';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '~/components/ui/Collapsible';
import Cookies from 'js-cookie';
import {
  vercelConnection,
  isConnecting,
  isFetchingStats,
  updateVercelConnection,
  fetchVercelStats,
  fetchVercelStatsViaAPI,
  initializeVercelConnection,
} from '~/lib/stores/vercel';
import { useI18n } from '~/i18n/hooks/useI18n';

interface ProjectAction {
  name: string;
  icon: string;
  action: (projectId: string) => Promise<void>;
  requiresConfirmation?: boolean;
  variant?: 'default' | 'destructive' | 'outline';
}

// Vercel logo SVG component
const VercelLogo = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path fill="currentColor" d="m12 2 10 18H2z" />
  </svg>
);

export default function VercelTab() {
  const { t } = useI18n('integrations');
  const connection = useStore(vercelConnection);
  const connecting = useStore(isConnecting);
  const fetchingStats = useStore(isFetchingStats);
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(false);
  const [isProjectActionLoading, setIsProjectActionLoading] = useState(false);

  // Use shared connection test hook
  const {
    testResult: connectionTest,
    testConnection,
    isTestingConnection,
  } = useConnectionTest({
    testEndpoint: '/api/vercel-user',
    serviceName: 'Vercel',
    getUserIdentifier: (data: VercelUserResponse) =>
      data.username || data.user?.username || data.email || data.user?.email || 'Vercel User',
  });

  // Memoize project actions to prevent unnecessary re-renders
  const projectActions: ProjectAction[] = useMemo(
    () => [
      {
        name: t('vercel.actions.redeploy'),
        icon: 'i-ph:arrows-clockwise',
        action: async (projectId: string) => {
          try {
            const response = await fetch(`https://api.vercel.com/v1/deployments`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${connection.token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: projectId,
                target: 'production',
              }),
            });

            if (!response.ok) {
              throw new Error('Failed to redeploy project');
            }

            toast.success(t('vercel.toast.redeployStarted'));
            await fetchVercelStats(connection.token);
          } catch (err: unknown) {
            const error = err instanceof Error ? err.message : t('shared.error.unknownError');
            toast.error(t('vercel.toast.redeployFailed', { error }));
          }
        },
      },
      {
        name: t('vercel.actions.viewDashboard'),
        icon: 'i-ph:layout',
        action: async (projectId: string) => {
          window.open(`https://vercel.com/dashboard/${projectId}`, '_blank');
        },
      },
      {
        name: t('vercel.actions.viewDeployments'),
        icon: 'i-ph:rocket',
        action: async (projectId: string) => {
          window.open(`https://vercel.com/dashboard/${projectId}/deployments`, '_blank');
        },
      },
      {
        name: t('vercel.actions.viewFunctions'),
        icon: 'i-ph:code',
        action: async (projectId: string) => {
          window.open(`https://vercel.com/dashboard/${projectId}/functions`, '_blank');
        },
      },
      {
        name: t('vercel.actions.viewAnalytics'),
        icon: 'i-ph:chart-bar',
        action: async (projectId: string) => {
          const project = connection.stats?.projects.find((p) => p.id === projectId);

          if (project) {
            window.open(`https://vercel.com/${connection.user?.username}/${project.name}/analytics`, '_blank');
          }
        },
      },
      {
        name: t('vercel.actions.viewDomains'),
        icon: 'i-ph:globe',
        action: async (projectId: string) => {
          window.open(`https://vercel.com/dashboard/${projectId}/domains`, '_blank');
        },
      },
      {
        name: t('vercel.actions.viewSettings'),
        icon: 'i-ph:gear',
        action: async (projectId: string) => {
          window.open(`https://vercel.com/dashboard/${projectId}/settings`, '_blank');
        },
      },
      {
        name: t('vercel.actions.viewLogs'),
        icon: 'i-ph:scroll',
        action: async (projectId: string) => {
          window.open(`https://vercel.com/dashboard/${projectId}/logs`, '_blank');
        },
      },
      {
        name: t('vercel.actions.deleteProject'),
        icon: 'i-ph:trash',
        action: async (projectId: string) => {
          try {
            const response = await fetch(`https://api.vercel.com/v1/projects/${projectId}`, {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${connection.token}`,
              },
            });

            if (!response.ok) {
              throw new Error('Failed to delete project');
            }

            toast.success(t('vercel.toast.projectDeleted'));
            await fetchVercelStats(connection.token);
          } catch (err: unknown) {
            const error = err instanceof Error ? err.message : t('shared.error.unknownError');
            toast.error(t('vercel.toast.deleteProjectFailed', { error }));
          }
        },
        requiresConfirmation: true,
        variant: 'destructive',
      },
    ],
    [connection.token, t],
  ); // Only re-create when token or t changes

  // Initialize connection on component mount - check server-side token first
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        // First try to initialize using server-side token
        await initializeVercelConnection();

        // If no connection was established, the user will need to manually enter a token
        const currentState = vercelConnection.get();

        if (!currentState.user) {
          console.log('No server-side Vercel token available, manual connection required');
        }
      } catch (error) {
        console.error('Failed to initialize Vercel connection:', error);
      }
    };
    initializeConnection();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      if (connection.user) {
        // Use server-side API if we have a connected user
        try {
          await fetchVercelStatsViaAPI(connection.token);
        } catch {
          // Fallback to direct API if server-side fails and we have a token
          if (connection.token) {
            await fetchVercelStats(connection.token);
          }
        }
      }
    };
    fetchProjects();
  }, [connection.user, connection.token]);

  const handleConnect = async (event: React.FormEvent) => {
    event.preventDefault();
    isConnecting.set(true);

    try {
      const token = connection.token;

      if (!token.trim()) {
        throw new Error(t('shared.error.tokenRequired'));
      }

      // First test the token directly with Vercel API
      const testResponse = await fetch('https://api.vercel.com/v2/user', {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'bolt.diy-app',
        },
      });

      if (!testResponse.ok) {
        if (testResponse.status === 401) {
          throw new Error(t('shared.error.unauthorized'));
        }

        throw new Error(`Vercel API error: ${testResponse.status}`);
      }

      const userData = (await testResponse.json()) as VercelUserResponse;

      // Set cookies for server-side API access
      Cookies.set('VITE_VERCEL_ACCESS_TOKEN', token, { expires: 365 });

      // Normalize the user data structure
      const normalizedUser = userData.user || {
        id: userData.id || '',
        username: userData.username || '',
        email: userData.email || '',
        name: userData.name || '',
        avatar: userData.avatar,
      };

      updateVercelConnection({
        user: normalizedUser,
        token,
      });

      await fetchVercelStats(token);
      toast.success(t('vercel.toast.connected'));
    } catch (error) {
      console.error('Auth error:', error);
      logStore.logError('Failed to authenticate with Vercel', { error });

      const errorMessage = error instanceof Error ? error.message : t('shared.error.connectionFailed');
      toast.error(errorMessage);
      updateVercelConnection({ user: null, token: '' });
    } finally {
      isConnecting.set(false);
    }
  };

  const handleDisconnect = () => {
    // Clear Vercel-related cookies
    Cookies.remove('VITE_VERCEL_ACCESS_TOKEN');

    updateVercelConnection({ user: null, token: '' });
    toast.success(t('vercel.toast.disconnected'));
  };

  const handleProjectAction = useCallback(
    async (projectId: string, action: ProjectAction) => {
      if (action.requiresConfirmation) {
        if (!confirm(t('shared.confirmAction', { action: action.name.toLowerCase() }))) {
          return;
        }
      }

      setIsProjectActionLoading(true);
      await action.action(projectId);
      setIsProjectActionLoading(false);
    },
    [t],
  );

  const renderProjects = useCallback(() => {
    if (fetchingStats) {
      return (
        <div className="flex items-center gap-2 text-sm text-bolt-elements-textSecondary">
          <div className="i-ph:spinner-gap w-4 h-4 animate-spin" />
          {t('shared.loading')}
        </div>
      );
    }

    return (
      <Collapsible open={isProjectsExpanded} onOpenChange={setIsProjectsExpanded}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 rounded-lg bg-bolt-elements-background dark:bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor dark:border-bolt-elements-borderColor hover:border-bolt-elements-borderColorActive/70 dark:hover:border-bolt-elements-borderColorActive/70 transition-all duration-200 cursor-pointer">
            <div className="flex items-center gap-2">
              <div className="i-ph:buildings w-4 h-4 text-bolt-elements-item-contentAccent" />
              <span className="text-sm font-medium text-bolt-elements-textPrimary">
                {t('vercel.projects.count', { count: connection.stats?.totalProjects || 0 })}
              </span>
            </div>
            <div
              className={classNames(
                'i-ph:caret-down w-4 h-4 transform transition-transform duration-200 text-bolt-elements-textSecondary',
                isProjectsExpanded ? 'rotate-180' : '',
              )}
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden">
          <div className="space-y-4 mt-4">
            {/* Vercel Overview Dashboard */}
            {connection.stats?.projects?.length ? (
              <div className="mb-6 p-4 bg-bolt-elements-background-depth-1 rounded-lg border border-bolt-elements-borderColor">
                <h4 className="text-sm font-medium text-bolt-elements-textPrimary mb-3">
                  {t('vercel.overview.title')}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-bolt-elements-textPrimary">
                      {connection.stats.totalProjects}
                    </div>
                    <div className="text-xs text-bolt-elements-textSecondary">{t('vercel.stats.totalProjects')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-bolt-elements-textPrimary">
                      {
                        connection.stats.projects.filter(
                          (p) => p.targets?.production?.alias && p.targets.production.alias.length > 0,
                        ).length
                      }
                    </div>
                    <div className="text-xs text-bolt-elements-textSecondary">{t('vercel.stats.deployedProjects')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-bolt-elements-textPrimary">
                      {new Set(connection.stats.projects.map((p) => p.framework).filter(Boolean)).size}
                    </div>
                    <div className="text-xs text-bolt-elements-textSecondary">{t('vercel.stats.frameworksUsed')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-bolt-elements-textPrimary">
                      {connection.stats.projects.filter((p) => p.latestDeployments?.[0]?.state === 'READY').length}
                    </div>
                    <div className="text-xs text-bolt-elements-textSecondary">
                      {t('vercel.stats.activeDeployments')}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Performance Analytics */}
            {connection.stats?.projects?.length ? (
              <div className="mb-6 space-y-4">
                <h4 className="text-sm font-medium text-bolt-elements-textPrimary">
                  {t('vercel.overview.activitySummary')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-bolt-elements-background-depth-2 p-3 rounded-lg border border-bolt-elements-borderColor">
                    <h6 className="text-xs font-medium text-bolt-elements-textPrimary flex items-center gap-2 mb-2">
                      <div className="i-ph:rocket w-4 h-4 text-bolt-elements-item-contentAccent" />
                      {t('vercel.overview.deploymentHealth')}
                    </h6>
                    <div className="space-y-1">
                      {(() => {
                        const totalDeployments = connection.stats.projects.reduce(
                          (sum, p) => sum + (p.latestDeployments?.length || 0),
                          0,
                        );
                        const readyDeployments = connection.stats.projects.filter(
                          (p) => p.latestDeployments?.[0]?.state === 'READY',
                        ).length;
                        const errorDeployments = connection.stats.projects.filter(
                          (p) => p.latestDeployments?.[0]?.state === 'ERROR',
                        ).length;
                        const successRate =
                          totalDeployments > 0
                            ? Math.round((readyDeployments / connection.stats.projects.length) * 100)
                            : 0;

                        return [
                          { label: t('vercel.stats.successRate'), value: `${successRate}%` },
                          { label: t('vercel.stats.active'), value: readyDeployments },
                          { label: t('vercel.stats.failed'), value: errorDeployments },
                        ];
                      })().map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-bolt-elements-textSecondary">{item.label}:</span>
                          <span className="text-bolt-elements-textPrimary font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-bolt-elements-background-depth-2 p-3 rounded-lg border border-bolt-elements-borderColor">
                    <h6 className="text-xs font-medium text-bolt-elements-textPrimary flex items-center gap-2 mb-2">
                      <div className="i-ph:chart-bar w-4 h-4 text-bolt-elements-item-contentAccent" />
                      {t('vercel.overview.frameworkDistribution')}
                    </h6>
                    <div className="space-y-1">
                      {(() => {
                        const frameworks = connection.stats.projects.reduce(
                          (acc, p) => {
                            if (p.framework) {
                              acc[p.framework] = (acc[p.framework] || 0) + 1;
                            }

                            return acc;
                          },
                          {} as Record<string, number>,
                        );

                        return Object.entries(frameworks)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 3)
                          .map(([framework, count]) => ({ label: framework, value: count }));
                      })().map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-bolt-elements-textSecondary">{item.label}:</span>
                          <span className="text-bolt-elements-textPrimary font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-bolt-elements-background-depth-2 p-3 rounded-lg border border-bolt-elements-borderColor">
                    <h6 className="text-xs font-medium text-bolt-elements-textPrimary flex items-center gap-2 mb-2">
                      <div className="i-ph:activity w-4 h-4 text-bolt-elements-item-contentAccent" />
                      {t('vercel.overview.activitySummary')}
                    </h6>
                    <div className="space-y-1">
                      {(() => {
                        const now = Date.now();
                        const recentDeployments = connection.stats.projects.filter((p) => {
                          const lastDeploy = p.latestDeployments?.[0]?.created;
                          return lastDeploy && now - new Date(lastDeploy).getTime() < 7 * 24 * 60 * 60 * 1000;
                        }).length;
                        const totalDomains = connection.stats.projects.reduce(
                          (sum, p) => sum + (p.targets?.production?.alias ? p.targets.production.alias.length : 0),
                          0,
                        );
                        const avgDomainsPerProject =
                          connection.stats.projects.length > 0
                            ? Math.round((totalDomains / connection.stats.projects.length) * 10) / 10
                            : 0;

                        return [
                          { label: t('vercel.stats.recent deploys'), value: recentDeployments },
                          { label: t('vercel.stats.total domains'), value: totalDomains },
                          { label: t('vercel.stats.avgDomainsPerProject'), value: avgDomainsPerProject },
                        ];
                      })().map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-bolt-elements-textSecondary">{item.label}:</span>
                          <span className="text-bolt-elements-textPrimary font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Project Health Overview */}
            {connection.stats?.projects?.length ? (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-bolt-elements-textPrimary mb-2">
                  {t('vercel.overview.projectHealth')}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(() => {
                    const healthyProjects = connection.stats.projects.filter(
                      (p) =>
                        p.latestDeployments?.[0]?.state === 'READY' && (p.targets?.production?.alias?.length ?? 0) > 0,
                    ).length;
                    const needsAttention = connection.stats.projects.filter(
                      (p) =>
                        p.latestDeployments?.[0]?.state === 'ERROR' || p.latestDeployments?.[0]?.state === 'CANCELED',
                    ).length;
                    const withCustomDomain = connection.stats.projects.filter((p) =>
                      p.targets?.production?.alias?.some((alias: string) => !alias.includes('.vercel.app')),
                    ).length;
                    const buildingProjects = connection.stats.projects.filter(
                      (p) => p.latestDeployments?.[0]?.state === 'BUILDING',
                    ).length;

                    return [
                      {
                        label: t('vercel.stats.healthyProjects'),
                        value: healthyProjects,
                        icon: 'i-ph:check-circle',
                        color: 'text-green-500',
                        bgColor: 'bg-green-100 dark:bg-green-900/20',
                        textColor: 'text-green-800 dark:text-green-400',
                      },
                      {
                        label: t('vercel.stats.customDomain'),
                        value: withCustomDomain,
                        icon: 'i-ph:globe',
                        color: 'text-blue-500',
                        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
                        textColor: 'text-blue-800 dark:text-blue-400',
                      },
                      {
                        label: t('vercel.stats.buildingProjects'),
                        value: buildingProjects,
                        icon: 'i-ph:gear',
                        color: 'text-yellow-500',
                        bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
                        textColor: 'text-yellow-800 dark:text-yellow-400',
                      },
                      {
                        label: t('vercel.stats.issues'),
                        value: needsAttention,
                        icon: 'i-ph:warning',
                        color: 'text-red-500',
                        bgColor: 'bg-red-100 dark:bg-red-900/20',
                        textColor: 'text-red-800 dark:text-red-400',
                      },
                    ];
                  })().map((metric, index) => (
                    <div
                      key={index}
                      className={`flex flex-col p-3 rounded-lg border border-bolt-elements-borderColor ${metric.bgColor}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`${metric.icon} w-4 h-4 ${metric.color}`} />
                        <span className="text-xs text-bolt-elements-textSecondary">{metric.label}</span>
                      </div>
                      <span className={`text-lg font-medium ${metric.textColor}`}>{metric.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {connection.stats?.projects?.length ? (
              <div className="grid gap-3">
                {connection.stats.projects.map((project) => (
                  <div
                    key={project.id}
                    className="p-4 rounded-lg border border-bolt-elements-borderColor hover:border-bolt-elements-borderColorActive/70 transition-colors bg-bolt-elements-background-depth-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-bolt-elements-textPrimary flex items-center gap-2">
                          <div className="i-ph:globe w-4 h-4 text-bolt-elements-borderColorActive" />
                          {project.name}
                        </h5>
                        <div className="flex items-center gap-2 mt-2 text-xs text-bolt-elements-textSecondary">
                          {project.targets?.production?.alias && project.targets.production.alias.length > 0 ? (
                            <>
                              <a
                                href={`https://${project.targets.production.alias.find((a: string) => a.endsWith('.vercel.app') && !a.includes('-projects.vercel.app')) || project.targets.production.alias[0]}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-bolt-elements-borderColorActive underline"
                              >
                                {project.targets.production.alias.find(
                                  (a: string) => a.endsWith('.vercel.app') && !a.includes('-projects.vercel.app'),
                                ) || project.targets.production.alias[0]}
                              </a>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <div className="i-ph:clock w-3 h-3" />
                                {new Date(project.createdAt).toLocaleDateString()}
                              </span>
                            </>
                          ) : project.latestDeployments && project.latestDeployments.length > 0 ? (
                            <>
                              <a
                                href={`https://${project.latestDeployments[0].url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-bolt-elements-borderColorActive underline"
                              >
                                {project.latestDeployments[0].url}
                              </a>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <div className="i-ph:clock w-3 h-3" />
                                {new Date(project.latestDeployments[0].created).toLocaleDateString()}
                              </span>
                            </>
                          ) : null}
                        </div>

                        {/* Project Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3 pt-3 border-t border-bolt-elements-borderColor">
                          <div className="text-center">
                            <div className="text-sm font-semibold text-bolt-elements-textPrimary">
                              {/* Deployments - This would be fetched from API */}
                              --
                            </div>
                            <div className="text-xs text-bolt-elements-textSecondary flex items-center justify-center gap-1">
                              <div className="i-ph:rocket w-3 h-3" />
                              {t('vercel.projects.deployments')}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-semibold text-bolt-elements-textPrimary">
                              {/* Domains - This would be fetched from API */}
                              --
                            </div>
                            <div className="text-xs text-bolt-elements-textSecondary flex items-center justify-center gap-1">
                              <div className="i-ph:globe w-3 h-3" />
                              {t('vercel.projects.domains')}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-semibold text-bolt-elements-textPrimary">
                              {/* Team Members - This would be fetched from API */}
                              --
                            </div>
                            <div className="text-xs text-bolt-elements-textSecondary flex items-center justify-center gap-1">
                              <div className="i-ph:users w-3 h-3" />
                              {t('vercel.projects.team')}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-semibold text-bolt-elements-textPrimary">
                              {/* Bandwidth - This would be fetched from API */}
                              --
                            </div>
                            <div className="text-xs text-bolt-elements-textSecondary flex items-center justify-center gap-1">
                              <div className="i-ph:activity w-3 h-3" />
                              {t('vercel.projects.bandwidth')}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {project.latestDeployments && project.latestDeployments.length > 0 && (
                          <div
                            className={classNames(
                              'flex items-center gap-1 px-2 py-1 rounded-full text-xs',
                              project.latestDeployments[0].state === 'READY'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : project.latestDeployments[0].state === 'ERROR'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
                            )}
                          >
                            <div
                              className={classNames(
                                'w-2 h-2 rounded-full',
                                project.latestDeployments[0].state === 'READY'
                                  ? 'bg-green-500'
                                  : project.latestDeployments[0].state === 'ERROR'
                                    ? 'bg-red-500'
                                    : 'bg-yellow-500',
                              )}
                            />
                            {project.latestDeployments[0].state}
                          </div>
                        )}
                        {project.framework && (
                          <div className="text-xs text-bolt-elements-textSecondary px-2 py-1 rounded-md bg-bolt-elements-background-depth-2">
                            <span className="flex items-center gap-1">
                              <div className="i-ph:code w-3 h-3" />
                              {project.framework}
                            </span>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://vercel.com/dashboard/${project.id}`, '_blank')}
                          className="flex items-center gap-1 text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary"
                        >
                          <div className="i-ph:arrow-square-out w-3 h-3" />
                          {t('vercel.projects.view')}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center flex-wrap gap-1 mt-3 pt-3 border-t border-bolt-elements-borderColor">
                      {projectActions.map((action) => (
                        <Button
                          key={action.name}
                          variant={action.variant || 'outline'}
                          size="sm"
                          onClick={() => handleProjectAction(project.id, action)}
                          disabled={isProjectActionLoading}
                          className="flex items-center gap-1 text-xs px-2 py-1 text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary"
                        >
                          <div className={`${action.icon} w-2.5 h-2.5`} />
                          {action.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-bolt-elements-textSecondary flex items-center gap-2 p-4">
                <div className="i-ph:info w-4 h-4" />
                {t('shared.noProjects', { service: 'Vercel' })}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }, [
    connection.stats,
    connection.user,
    fetchingStats,
    isProjectsExpanded,
    isProjectActionLoading,
    handleProjectAction,
    projectActions,
    t,
  ]);

  console.log('connection', connection);

  return (
    <div className="space-y-6">
      <ServiceHeader
        icon={VercelLogo}
        title={t('vercel.title')}
        description={t('vercel.description')}
        onTestConnection={connection.user ? () => testConnection() : undefined}
        isTestingConnection={isTestingConnection}
      />

      <ConnectionTestIndicator testResult={connectionTest} />

      {/* Main Connection Component */}
      <motion.div
        className="bg-bolt-elements-background dark:bg-bolt-elements-background border border-bolt-elements-borderColor dark:border-bolt-elements-borderColor rounded-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="p-6 space-y-6">
          {!connection.user ? (
            <div className="space-y-4">
              <div className="text-xs text-bolt-elements-textSecondary bg-bolt-elements-background-depth-1 dark:bg-bolt-elements-background-depth-1 p-3 rounded-lg mb-4">
                <p className="flex items-center gap-1 mb-1">
                  <span className="i-ph:lightbulb w-3.5 h-3.5 text-bolt-elements-icon-success dark:text-bolt-elements-icon-success" />
                  <span className="font-medium">{t('shared.tip')}</span>{' '}
                  {t('shared.envVarTip', { varName: 'VITE_VERCEL_ACCESS_TOKEN' })}
                </p>
              </div>

              <div>
                <label className="block text-sm text-bolt-elements-textSecondary mb-2">{t('vercel.tokenLabel')}</label>
                <input
                  type="password"
                  value={connection.token}
                  onChange={(e) => updateVercelConnection({ ...connection, token: e.target.value })}
                  disabled={connecting}
                  placeholder={t('vercel.tokenPlaceholder')}
                  className={classNames(
                    'w-full px-3 py-2 rounded-lg text-sm',
                    'bg-[#F8F8F8] dark:bg-[#1A1A1A]',
                    'border border-[#E5E5E5] dark:border-[#333333]',
                    'text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary',
                    'focus:outline-none focus:ring-1 focus:ring-bolt-elements-borderColorActive',
                    'disabled:opacity-50',
                  )}
                />
                <div className="mt-2 text-sm text-bolt-elements-textSecondary">
                  <a
                    href="https://vercel.com/account/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-bolt-elements-borderColorActive hover:underline inline-flex items-center gap-1"
                  >
                    {t('shared.getToken')}
                    <div className="i-ph:arrow-square-out w-4 h-4" />
                  </a>
                </div>
              </div>

              <button
                onClick={handleConnect}
                disabled={connecting || !connection.token}
                className={classNames(
                  'px-4 py-2 rounded-lg text-sm flex items-center gap-2',
                  'bg-[#303030] text-white',
                  'hover:bg-[#5E41D0] hover:text-white',
                  'disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200',
                  'transform active:scale-95',
                )}
              >
                {connecting ? (
                  <>
                    <div className="i-ph:spinner-gap animate-spin" />
                    {t('shared.connecting')}
                  </>
                ) : (
                  <>
                    <div className="i-ph:plug-charging w-4 h-4" />
                    {t('shared.connect')}
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDisconnect}
                    className={classNames(
                      'px-4 py-2 rounded-lg text-sm flex items-center gap-2',
                      'bg-red-500 text-white',
                      'hover:bg-red-600',
                    )}
                  >
                    <div className="i-ph:plug w-4 h-4" />
                    {t('shared.disconnect')}
                  </button>
                  <span className="text-sm text-bolt-elements-textSecondary flex items-center gap-1">
                    <div className="i-ph:check-circle w-4 h-4 text-green-500" />
                    {t('shared.connected', { service: 'Vercel' })}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-bolt-elements-background-depth-1 dark:bg-bolt-elements-background-depth-1 rounded-lg">
                  <img
                    src={`https://vercel.com/api/www/avatar?u=${connection.user?.username}`}
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    alt="Avatar"
                    className="w-12 h-12 rounded-full border-2 border-bolt-elements-borderColorActive"
                  />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-bolt-elements-textPrimary">
                      {connection.user?.username || 'Vercel User'}
                    </h4>
                    <p className="text-sm text-bolt-elements-textSecondary">
                      {connection.user?.email || 'No email available'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-bolt-elements-textSecondary">
                      <span className="flex items-center gap-1">
                        <div className="i-ph:buildings w-3 h-3" />
                        {connection.stats?.totalProjects || 0} {t('vercel.projects.title')}
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="i-ph:check-circle w-3 h-3" />
                        {connection.stats?.projects.filter((p) => p.latestDeployments?.[0]?.state === 'READY').length ||
                          0}{' '}
                        Live
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="i-ph:users w-3 h-3" />
                        {/* Team size would be fetched from API */}
                        --
                      </span>
                    </div>
                  </div>
                </div>

                {/* Usage Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-bolt-elements-background-depth-1 rounded-lg border border-bolt-elements-borderColor">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="i-ph:buildings w-4 h-4 text-bolt-elements-item-contentAccent" />
                      <span className="text-xs font-medium text-bolt-elements-textPrimary">
                        {t('vercel.projects.title')}
                      </span>
                    </div>
                    <div className="text-sm text-bolt-elements-textSecondary">
                      <div>
                        {t('vercel.stats.active')}:{' '}
                        {connection.stats?.projects.filter((p) => p.latestDeployments?.[0]?.state === 'READY').length ||
                          0}
                      </div>
                      <div>
                        {t('vercel.stats.totalProjects')}: {connection.stats?.totalProjects || 0}
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-bolt-elements-background-depth-1 rounded-lg border border-bolt-elements-borderColor">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="i-ph:globe w-4 h-4 text-bolt-elements-item-contentAccent" />
                      <span className="text-xs font-medium text-bolt-elements-textPrimary">
                        {t('vercel.projects.domains')}
                      </span>
                    </div>
                    <div className="text-sm text-bolt-elements-textSecondary">
                      {/* Domain usage would be fetched from API */}
                      <div>Custom: --</div>
                      <div>Vercel: --</div>
                    </div>
                  </div>
                  <div className="p-3 bg-bolt-elements-background-depth-1 rounded-lg border border-bolt-elements-borderColor">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="i-ph:activity w-4 h-4 text-bolt-elements-item-contentAccent" />
                      <span className="text-xs font-medium text-bolt-elements-textPrimary">Usage</span>
                    </div>
                    <div className="text-sm text-bolt-elements-textSecondary">
                      {/* Usage metrics would be fetched from API */}
                      <div>{t('vercel.projects.bandwidth')}: --</div>
                      <div>Requests: --</div>
                    </div>
                  </div>
                </div>
              </div>

              {renderProjects()}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
