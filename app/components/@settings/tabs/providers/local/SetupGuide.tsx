import React from 'react';
import { Button } from '~/components/ui/Button';
import { Card, CardContent, CardHeader } from '~/components/ui/Card';
import {
  Cpu,
  Server,
  Settings,
  ExternalLink,
  Package,
  Code,
  Database,
  CheckCircle,
  AlertCircle,
  Activity,
  Cable,
  ArrowLeft,
  Download,
  Shield,
  Globe,
  Terminal,
  Monitor,
  Wifi,
} from 'lucide-react';
import { useI18n } from '~/i18n/hooks/useI18n';

// Setup Guide Component
function SetupGuide({ onBack }: { onBack: () => void }) {
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
          <h2 className="text-xl font-semibold text-bolt-elements-textPrimary">{t('local.setupGuideDetail.title')}</h2>
          <p className="text-sm text-bolt-elements-textSecondary">{t('local.setupGuideDetail.subtitle')}</p>
        </div>
      </div>

      {/* Hardware Requirements Overview */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-bolt-elements-textPrimary">
                {t('local.setupGuideDetail.systemRequirements.title')}
              </h3>
              <p className="text-sm text-bolt-elements-textSecondary">
                {t('local.setupGuideDetail.systemRequirements.subtitle')}
              </p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-green-500" />
                <span className="font-medium text-bolt-elements-textPrimary">
                  {t('local.setupGuideDetail.systemRequirements.cpu.label')}
                </span>
              </div>
              <p className="text-bolt-elements-textSecondary">
                {t('local.setupGuideDetail.systemRequirements.cpu.desc')}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-bolt-elements-textPrimary">
                  {t('local.setupGuideDetail.systemRequirements.ram.label')}
                </span>
              </div>
              <p className="text-bolt-elements-textSecondary">
                {t('local.setupGuideDetail.systemRequirements.ram.desc')}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-purple-500" />
                <span className="font-medium text-bolt-elements-textPrimary">
                  {t('local.setupGuideDetail.systemRequirements.gpu.label')}
                </span>
              </div>
              <p className="text-bolt-elements-textSecondary">
                {t('local.setupGuideDetail.systemRequirements.gpu.desc')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ollama Setup Section */}
      <Card className="bg-bolt-elements-background-depth-2 shadow-sm">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center ring-1 ring-purple-500/30">
              <Server className="w-6 h-6 text-purple-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-bolt-elements-textPrimary">
                {t('local.setupGuideDetail.ollama.title')}
              </h3>
              <p className="text-sm text-bolt-elements-textSecondary">{t('local.setupGuideDetail.ollama.subtitle')}</p>
            </div>
            <span className="px-3 py-1 bg-purple-500/10 text-purple-500 text-xs font-medium rounded-full">
              {t('local.setupGuideDetail.ollama.recommended')}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Installation Options */}
          <div className="space-y-4">
            <h4 className="font-medium text-bolt-elements-textPrimary flex items-center gap-2">
              <Download className="w-4 h-4" />
              {t('local.setupGuideDetail.ollama.installation.title')}
            </h4>

            {/* Desktop App - New and Recommended */}
            <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Monitor className="w-5 h-5 text-green-500" />
                <h5 className="font-medium text-green-500">
                  {t('local.setupGuideDetail.ollama.installation.desktopApp.title')}
                </h5>
              </div>
              <p className="text-sm text-bolt-elements-textSecondary mb-3">
                {t('local.setupGuideDetail.ollama.installation.desktopApp.desc')}
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-bolt-elements-background-depth-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Monitor className="w-4 h-4 text-bolt-elements-textPrimary" />
                    <strong className="text-bolt-elements-textPrimary">
                      {t('local.setupGuideDetail.ollama.installation.desktopApp.macOS')}
                    </strong>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-gradient-to-r from-purple-500/10 to-purple-600/10 hover:from-purple-500/20 hover:to-purple-600/20 border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 gap-2 group shadow-sm hover:shadow-lg hover:shadow-purple-500/20 font-medium"
                    _asChild
                  >
                    <a
                      href="https://ollama.com/download/mac"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 flex-shrink-0" />
                      <span className="flex-1 text-center font-medium">
                        {t('local.setupGuideDetail.ollama.installation.desktopApp.downloadButton')}
                      </span>
                      <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 flex-shrink-0" />
                    </a>
                  </Button>
                </div>
                <div className="p-3 rounded-lg bg-bolt-elements-background-depth-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Monitor className="w-4 h-4 text-bolt-elements-textPrimary" />
                    <strong className="text-bolt-elements-textPrimary">
                      {t('local.setupGuideDetail.ollama.installation.desktopApp.windows')}
                    </strong>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-gradient-to-r from-purple-500/10 to-purple-600/10 hover:from-purple-500/20 hover:to-purple-600/20 border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 gap-2 group shadow-sm hover:shadow-lg hover:shadow-purple-500/20 font-medium"
                    _asChild
                  >
                    <a
                      href="https://ollama.com/download/windows"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 flex-shrink-0" />
                      <span className="flex-1 text-center font-medium">
                        {t('local.setupGuideDetail.ollama.installation.desktopApp.downloadButton')}
                      </span>
                      <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 flex-shrink-0" />
                    </a>
                  </Button>
                </div>
              </div>
              <div className="mt-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <span className="font-medium text-blue-500 text-sm">
                    {t('local.setupGuideDetail.ollama.installation.desktopApp.webInterface')}
                  </span>
                </div>
                <p className="text-xs text-bolt-elements-textSecondary">
                  {t('local.setupGuideDetail.ollama.installation.desktopApp.webInterfaceDesc')}{' '}
                  <code className="bg-bolt-elements-background-depth-4 px-1 rounded">http://localhost:11434</code>
                </p>
              </div>
            </div>

            {/* CLI Installation */}
            <div className="p-4 rounded-lg bg-bolt-elements-background-depth-3">
              <div className="flex items-center gap-2 mb-3">
                <Terminal className="w-5 h-5 text-bolt-elements-textPrimary" />
                <h5 className="font-medium text-bolt-elements-textPrimary">
                  {t('local.setupGuideDetail.ollama.installation.cli.title')}
                </h5>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-bolt-elements-background-depth-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Monitor className="w-4 h-4 text-bolt-elements-textPrimary" />
                    <strong className="text-bolt-elements-textPrimary">
                      {t('local.setupGuideDetail.ollama.installation.cli.windows')}
                    </strong>
                  </div>
                  <div className="text-xs bg-bolt-elements-background-depth-4 p-2 rounded font-mono text-bolt-elements-textPrimary">
                    winget install Ollama.Ollama
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-bolt-elements-background-depth-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Monitor className="w-4 h-4 text-bolt-elements-textPrimary" />
                    <strong className="text-bolt-elements-textPrimary">
                      {t('local.setupGuideDetail.ollama.installation.cli.macOS')}
                    </strong>
                  </div>
                  <div className="text-xs bg-bolt-elements-background-depth-4 p-2 rounded font-mono text-bolt-elements-textPrimary">
                    brew install ollama
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-bolt-elements-background-depth-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Terminal className="w-4 h-4 text-bolt-elements-textPrimary" />
                    <strong className="text-bolt-elements-textPrimary">
                      {t('local.setupGuideDetail.ollama.installation.cli.linux')}
                    </strong>
                  </div>
                  <div className="text-xs bg-bolt-elements-background-depth-4 p-2 rounded font-mono text-bolt-elements-textPrimary">
                    curl -fsSL https://ollama.com/install.sh | sh
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Latest Model Recommendations */}
          <div className="space-y-4">
            <h4 className="font-medium text-bolt-elements-textPrimary flex items-center gap-2">
              <Package className="w-4 h-4" />
              {t('local.setupGuideDetail.ollama.models.title')}
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-bolt-elements-background-depth-3">
                <h5 className="font-medium text-bolt-elements-textPrimary mb-3 flex items-center gap-2">
                  <Code className="w-4 h-4 text-green-500" />
                  {t('local.setupGuideDetail.ollama.models.codeDev')}
                </h5>
                <div className="space-y-2 text-xs bg-bolt-elements-background-depth-4 p-3 rounded font-mono text-bolt-elements-textPrimary">
                  <div>{t('local.setupGuideDetail.ollama.models.codeComment')}</div>
                  <div>ollama pull llama3.2:3b</div>
                  <div>ollama pull codellama:13b</div>
                  <div>ollama pull deepseek-coder-v2</div>
                  <div>ollama pull qwen2.5-coder:7b</div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-bolt-elements-background-depth-3">
                <h5 className="font-medium text-bolt-elements-textPrimary mb-3 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-500" />
                  {t('local.setupGuideDetail.ollama.models.generalChat')}
                </h5>
                <div className="space-y-2 text-xs bg-bolt-elements-background-depth-4 p-3 rounded font-mono text-bolt-elements-textPrimary">
                  <div>{t('local.setupGuideDetail.ollama.models.generalComment')}</div>
                  <div>ollama pull llama3.2:3b</div>
                  <div>ollama pull mistral:7b</div>
                  <div>ollama pull phi3.5:3.8b</div>
                  <div>ollama pull qwen2.5:7b</div>
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-purple-500" />
                  <span className="font-medium text-purple-500">
                    {t('local.setupGuideDetail.ollama.models.performance.title')}
                  </span>
                </div>
                <ul className="text-xs text-bolt-elements-textSecondary space-y-1">
                  <li>• {t('local.setupGuideDetail.ollama.models.performance.llama')}</li>
                  <li>• {t('local.setupGuideDetail.ollama.models.performance.phi')}</li>
                  <li>• {t('local.setupGuideDetail.ollama.models.performance.qwen')}</li>
                  <li>• {t('local.setupGuideDetail.ollama.models.performance.mistral')}</li>
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium text-yellow-500">
                    {t('local.setupGuideDetail.ollama.models.tips.title')}
                  </span>
                </div>
                <ul className="text-xs text-bolt-elements-textSecondary space-y-1">
                  <li>• {t('local.setupGuideDetail.ollama.models.tips.tip1')}</li>
                  <li>• {t('local.setupGuideDetail.ollama.models.tips.tip2')}</li>
                  <li>• {t('local.setupGuideDetail.ollama.models.tips.tip3')}</li>
                  <li>• {t('local.setupGuideDetail.ollama.models.tips.tip4')}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Desktop App Features */}
          <div className="space-y-4">
            <h4 className="font-medium text-bolt-elements-textPrimary flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              {t('local.setupGuideDetail.ollama.desktopFeatures.title')}
            </h4>
            <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-blue-500 mb-3">
                    {t('local.setupGuideDetail.ollama.desktopFeatures.ui.title')}
                  </h5>
                  <ul className="text-sm text-bolt-elements-textSecondary space-y-1">
                    <li>• {t('local.setupGuideDetail.ollama.desktopFeatures.ui.browser')}</li>
                    <li>• {t('local.setupGuideDetail.ollama.desktopFeatures.ui.downloads')}</li>
                    <li>• {t('local.setupGuideDetail.ollama.desktopFeatures.ui.chat')}</li>
                    <li>• {t('local.setupGuideDetail.ollama.desktopFeatures.ui.monitoring')}</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-blue-500 mb-3">
                    {t('local.setupGuideDetail.ollama.desktopFeatures.management.title')}
                  </h5>
                  <ul className="text-sm text-bolt-elements-textSecondary space-y-1">
                    <li>• {t('local.setupGuideDetail.ollama.desktopFeatures.management.updates')}</li>
                    <li>• {t('local.setupGuideDetail.ollama.desktopFeatures.management.optimization')}</li>
                    <li>• {t('local.setupGuideDetail.ollama.desktopFeatures.management.gpu')}</li>
                    <li>• {t('local.setupGuideDetail.ollama.desktopFeatures.management.compatibility')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="space-y-4">
            <h4 className="font-medium text-bolt-elements-textPrimary flex items-center gap-2">
              <Settings className="w-4 h-4" />
              {t('local.setupGuideDetail.ollama.troubleshooting.title')}
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                <h5 className="font-medium text-red-500 mb-2">
                  {t('local.setupGuideDetail.ollama.troubleshooting.commonIssues.title')}
                </h5>
                <ul className="text-xs text-bolt-elements-textSecondary space-y-1">
                  <li>• {t('local.setupGuideDetail.ollama.troubleshooting.commonIssues.notStarting')}</li>
                  <li>• {t('local.setupGuideDetail.ollama.troubleshooting.commonIssues.noGpu')}</li>
                  <li>• {t('local.setupGuideDetail.ollama.troubleshooting.commonIssues.portBlocked')}</li>
                  <li>• {t('local.setupGuideDetail.ollama.troubleshooting.commonIssues.modelsNotLoading')}</li>
                  <li>• {t('local.setupGuideDetail.ollama.troubleshooting.commonIssues.slowPerformance')}</li>
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                <h5 className="font-medium text-green-500 mb-2">
                  {t('local.setupGuideDetail.ollama.troubleshooting.commands.title')}
                </h5>
                <div className="text-xs bg-bolt-elements-background-depth-4 p-3 rounded font-mono text-bolt-elements-textPrimary space-y-1">
                  <div>{t('local.setupGuideDetail.ollama.troubleshooting.commands.checkModels')}</div>
                  <div>ollama list</div>
                  <div></div>
                  <div>{t('local.setupGuideDetail.ollama.troubleshooting.commands.removeModels')}</div>
                  <div>ollama rm model_name</div>
                  <div></div>
                  <div>{t('local.setupGuideDetail.ollama.troubleshooting.commands.checkGpu')}</div>
                  <div>ollama ps</div>
                  <div></div>
                  <div>{t('local.setupGuideDetail.ollama.troubleshooting.commands.viewLogs')}</div>
                  <div>ollama logs</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LM Studio Setup Section */}
      <Card className="bg-bolt-elements-background-depth-2 shadow-sm">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center ring-1 ring-blue-500/30">
              <Monitor className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-bolt-elements-textPrimary">
                {t('local.setupGuideDetail.lmstudio.title')}
              </h3>
              <p className="text-sm text-bolt-elements-textSecondary">
                {t('local.setupGuideDetail.lmstudio.subtitle')}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Installation */}
          <div className="space-y-4">
            <h4 className="font-medium text-bolt-elements-textPrimary flex items-center gap-2">
              <Download className="w-4 h-4" />
              {t('local.setupGuideDetail.lmstudio.installation.title')}
            </h4>
            <div className="p-4 rounded-lg bg-bolt-elements-background-depth-3">
              <p className="text-sm text-bolt-elements-textSecondary mb-3">
                {t('local.setupGuideDetail.lmstudio.installation.desc')}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 border-blue-500/30 hover:border-blue-500/50 transition-all duration-300 gap-2 group shadow-sm hover:shadow-lg hover:shadow-blue-500/20 font-medium"
                _asChild
              >
                <a
                  href="https://lmstudio.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 flex-shrink-0" />
                  <span className="flex-1 text-center font-medium">
                    {t('local.setupGuideDetail.lmstudio.installation.downloadButton')}
                  </span>
                  <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 flex-shrink-0" />
                </a>
              </Button>
            </div>
          </div>

          {/* Configuration */}
          <div className="space-y-4">
            <h4 className="font-medium text-bolt-elements-textPrimary flex items-center gap-2">
              <Settings className="w-4 h-4" />
              {t('local.setupGuideDetail.lmstudio.configuration.title')}
            </h4>
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-bolt-elements-background-depth-3">
                <h5 className="font-medium text-bolt-elements-textPrimary mb-2">
                  {t('local.setupGuideDetail.lmstudio.configuration.serverSetup.title')}
                </h5>
                <ol className="text-xs text-bolt-elements-textSecondary space-y-1 list-decimal list-inside">
                  <li>{t('local.setupGuideDetail.lmstudio.configuration.serverSetup.step1')}</li>
                  <li>{t('local.setupGuideDetail.lmstudio.configuration.serverSetup.step2')}</li>
                  <li>{t('local.setupGuideDetail.lmstudio.configuration.serverSetup.step3')}</li>
                  <li>{t('local.setupGuideDetail.lmstudio.configuration.serverSetup.step4')}</li>
                  <li>{t('local.setupGuideDetail.lmstudio.configuration.serverSetup.step5')}</li>
                </ol>
              </div>

              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="font-medium text-red-500">
                    {t('local.setupGuideDetail.lmstudio.configuration.cors.title')}
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-bolt-elements-textSecondary">
                    {t('local.setupGuideDetail.lmstudio.configuration.cors.warning')}
                  </p>
                  <ol className="text-xs text-bolt-elements-textSecondary space-y-1 list-decimal list-inside ml-2">
                    <li>{t('local.setupGuideDetail.lmstudio.configuration.cors.step1')}</li>
                    <li>{t('local.setupGuideDetail.lmstudio.configuration.cors.step2')}</li>
                    <li>
                      {t('local.setupGuideDetail.lmstudio.configuration.cors.step3')}{' '}
                      <code className="bg-bolt-elements-background-depth-4 px-1 rounded">lms server start --cors</code>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Advantages */}
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-blue-500">{t('local.setupGuideDetail.lmstudio.advantages.title')}</span>
            </div>
            <ul className="text-xs text-bolt-elements-textSecondary space-y-1 list-disc list-inside">
              <li>{t('local.setupGuideDetail.lmstudio.advantages.downloader')}</li>
              <li>{t('local.setupGuideDetail.lmstudio.advantages.switching')}</li>
              <li>{t('local.setupGuideDetail.lmstudio.advantages.chat')}</li>
              <li>{t('local.setupGuideDetail.lmstudio.advantages.gguf')}</li>
              <li>{t('local.setupGuideDetail.lmstudio.advantages.updates')}</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* LocalAI Setup Section */}
      <Card className="bg-bolt-elements-background-depth-2 shadow-sm">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center ring-1 ring-green-500/30">
              <Globe className="w-6 h-6 text-green-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-bolt-elements-textPrimary">
                {t('local.setupGuideDetail.localai.title')}
              </h3>
              <p className="text-sm text-bolt-elements-textSecondary">{t('local.setupGuideDetail.localai.subtitle')}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Installation */}
          <div className="space-y-4">
            <h4 className="font-medium text-bolt-elements-textPrimary flex items-center gap-2">
              <Download className="w-4 h-4" />
              {t('local.setupGuideDetail.localai.installation.title')}
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-bolt-elements-background-depth-3">
                <h5 className="font-medium text-bolt-elements-textPrimary mb-2">
                  {t('local.setupGuideDetail.localai.installation.quickInstall')}
                </h5>
                <div className="text-xs bg-bolt-elements-background-depth-4 p-3 rounded font-mono text-bolt-elements-textPrimary space-y-1">
                  <div>{t('local.setupGuideDetail.localai.installation.quickInstallCommand')}</div>
                  <div>curl https://localai.io/install.sh | sh</div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-bolt-elements-background-depth-3">
                <h5 className="font-medium text-bolt-elements-textPrimary mb-2">
                  {t('local.setupGuideDetail.localai.installation.docker')}
                </h5>
                <div className="text-xs bg-bolt-elements-background-depth-4 p-3 rounded font-mono text-bolt-elements-textPrimary space-y-1">
                  <div>docker run -p 8080:8080</div>
                  <div>quay.io/go-skynet/local-ai:latest</div>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="space-y-4">
            <h4 className="font-medium text-bolt-elements-textPrimary flex items-center gap-2">
              <Settings className="w-4 h-4" />
              {t('local.setupGuideDetail.localai.configuration.title')}
            </h4>
            <div className="p-4 rounded-lg bg-bolt-elements-background-depth-3">
              <p className="text-sm text-bolt-elements-textSecondary mb-3">
                {t('local.setupGuideDetail.localai.configuration.desc')}
              </p>
              <div className="text-xs bg-bolt-elements-background-depth-4 p-3 rounded font-mono text-bolt-elements-textPrimary space-y-1">
                <div>{t('local.setupGuideDetail.localai.configuration.exampleComment')}</div>
                <div>models:</div>
                <div>- name: llama3.1</div>
                <div>backend: llama</div>
                <div>parameters:</div>
                <div>model: llama3.1.gguf</div>
              </div>
            </div>
          </div>

          {/* Advantages */}
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="font-medium text-green-500">{t('local.setupGuideDetail.localai.advantages.title')}</span>
            </div>
            <ul className="text-xs text-bolt-elements-textSecondary space-y-1 list-disc list-inside">
              <li>{t('local.setupGuideDetail.localai.advantages.apiCompatibility')}</li>
              <li>{t('local.setupGuideDetail.localai.advantages.multipleFormats')}</li>
              <li>{t('local.setupGuideDetail.localai.advantages.docker')}</li>
              <li>{t('local.setupGuideDetail.localai.advantages.gallery')}</li>
              <li>{t('local.setupGuideDetail.localai.advantages.restApi')}</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Performance Optimization */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-bolt-elements-textPrimary">
                {t('local.setupGuideDetail.performance.title')}
              </h3>
              <p className="text-sm text-bolt-elements-textSecondary">
                {t('local.setupGuideDetail.performance.subtitle')}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-bolt-elements-textPrimary">
                {t('local.setupGuideDetail.performance.hardware.title')}
              </h4>
              <ul className="text-sm text-bolt-elements-textSecondary space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t('local.setupGuideDetail.performance.hardware.gpu')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t('local.setupGuideDetail.performance.hardware.ram')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t('local.setupGuideDetail.performance.hardware.ssd')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t('local.setupGuideDetail.performance.hardware.closeApps')}</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-bolt-elements-textPrimary">
                {t('local.setupGuideDetail.performance.software.title')}
              </h4>
              <ul className="text-sm text-bolt-elements-textSecondary space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>{t('local.setupGuideDetail.performance.software.smallerModels')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>{t('local.setupGuideDetail.performance.software.quantization')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>{t('local.setupGuideDetail.performance.software.contextLength')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>{t('local.setupGuideDetail.performance.software.streaming')}</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alternative Options */}
      <Card className="bg-bolt-elements-background-depth-2 shadow-sm">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center ring-1 ring-orange-500/30">
              <Wifi className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-bolt-elements-textPrimary">
                {t('local.setupGuideDetail.alternatives.title')}
              </h3>
              <p className="text-sm text-bolt-elements-textSecondary">
                {t('local.setupGuideDetail.alternatives.subtitle')}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-bolt-elements-textPrimary">
                {t('local.setupGuideDetail.alternatives.local.title')}
              </h4>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-bolt-elements-background-depth-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-bolt-elements-textPrimary">
                      {t('local.setupGuideDetail.alternatives.local.jan.name')}
                    </span>
                  </div>
                  <p className="text-xs text-bolt-elements-textSecondary">
                    {t('local.setupGuideDetail.alternatives.local.jan.desc')}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-bolt-elements-background-depth-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Terminal className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-bolt-elements-textPrimary">
                      {t('local.setupGuideDetail.alternatives.local.oobabooga.name')}
                    </span>
                  </div>
                  <p className="text-xs text-bolt-elements-textSecondary">
                    {t('local.setupGuideDetail.alternatives.local.oobabooga.desc')}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-bolt-elements-background-depth-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Cable className="w-4 h-4 text-purple-500" />
                    <span className="font-medium text-bolt-elements-textPrimary">
                      {t('local.setupGuideDetail.alternatives.local.koboldai.name')}
                    </span>
                  </div>
                  <p className="text-xs text-bolt-elements-textSecondary">
                    {t('local.setupGuideDetail.alternatives.local.koboldai.desc')}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium text-bolt-elements-textPrimary">
                {t('local.setupGuideDetail.alternatives.cloud.title')}
              </h4>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-bolt-elements-background-depth-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="w-4 h-4 text-orange-500" />
                    <span className="font-medium text-bolt-elements-textPrimary">
                      {t('local.setupGuideDetail.alternatives.cloud.openrouter.name')}
                    </span>
                  </div>
                  <p className="text-xs text-bolt-elements-textSecondary">
                    {t('local.setupGuideDetail.alternatives.cloud.openrouter.desc')}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-bolt-elements-background-depth-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Server className="w-4 h-4 text-red-500" />
                    <span className="font-medium text-bolt-elements-textPrimary">
                      {t('local.setupGuideDetail.alternatives.cloud.together.name')}
                    </span>
                  </div>
                  <p className="text-xs text-bolt-elements-textSecondary">
                    {t('local.setupGuideDetail.alternatives.cloud.together.desc')}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-bolt-elements-background-depth-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-pink-500" />
                    <span className="font-medium text-bolt-elements-textPrimary">
                      {t('local.setupGuideDetail.alternatives.cloud.groq.name')}
                    </span>
                  </div>
                  <p className="text-xs text-bolt-elements-textSecondary">
                    {t('local.setupGuideDetail.alternatives.cloud.groq.desc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SetupGuide;
