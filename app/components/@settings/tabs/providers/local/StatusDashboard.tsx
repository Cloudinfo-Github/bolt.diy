import React from 'react';
import { Button } from '~/components/ui/Button';
import { Card, CardContent } from '~/components/ui/Card';
import { Cable, Server, ArrowLeft } from 'lucide-react';
import { useLocalModelHealth } from '~/lib/hooks/useLocalModelHealth';
import { useI18n } from '~/i18n/hooks/useI18n';
import HealthStatusBadge from './HealthStatusBadge';
import { PROVIDER_ICONS } from './types';

// Status Dashboard Component
function StatusDashboard({ onBack }: { onBack: () => void }) {
  const { healthStatuses } = useLocalModelHealth();
  const { t } = useI18n('providers');

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="bg-transparent hover:bg-transparent text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-all duration-200 p-2"
          aria-label={t('local.backToDashboard')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold text-bolt-elements-textPrimary">{t('local.statusDashboard.title')}</h2>
          <p className="text-sm text-bolt-elements-textSecondary">{t('local.statusDashboard.subtitle')}</p>
        </div>
      </div>

      {healthStatuses.length === 0 ? (
        <Card className="bg-bolt-elements-background-depth-2">
          <CardContent className="p-8 text-center">
            <Cable className="w-16 h-16 mx-auto text-bolt-elements-textTertiary mb-4" />
            <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-2">
              {t('local.statusDashboard.noEndpointsConfigured')}
            </h3>
            <p className="text-sm text-bolt-elements-textSecondary">{t('local.statusDashboard.noEndpointsDesc')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {healthStatuses.map((status) => (
            <Card key={`${status.provider}-${status.baseUrl}`} className="bg-bolt-elements-background-depth-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-bolt-elements-background-depth-3 flex items-center justify-center">
                      {React.createElement(PROVIDER_ICONS[status.provider as keyof typeof PROVIDER_ICONS] || Server, {
                        className: 'w-5 h-5 text-bolt-elements-textPrimary',
                      })}
                    </div>
                    <div>
                      <h3 className="font-semibold text-bolt-elements-textPrimary">{status.provider}</h3>
                      <p className="text-xs text-bolt-elements-textSecondary font-mono">{status.baseUrl}</p>
                    </div>
                  </div>
                  <HealthStatusBadge status={status.status} responseTime={status.responseTime} />
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-bolt-elements-textSecondary">{t('local.statusDashboard.models')}</div>
                    <div className="text-lg font-semibold text-bolt-elements-textPrimary">
                      {status.availableModels?.length || 0}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-bolt-elements-textSecondary">{t('local.statusDashboard.version')}</div>
                    <div className="text-lg font-semibold text-bolt-elements-textPrimary">
                      {status.version || t('local.statusDashboard.unknown')}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-bolt-elements-textSecondary">{t('local.statusDashboard.lastCheck')}</div>
                    <div className="text-lg font-semibold text-bolt-elements-textPrimary">
                      {status.lastChecked
                        ? new Date(status.lastChecked).toLocaleTimeString()
                        : t('local.statusDashboard.never')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default StatusDashboard;
