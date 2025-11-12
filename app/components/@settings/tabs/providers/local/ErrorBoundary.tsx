import React, { Component } from 'react';
import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { classNames } from '~/utils/classNames';
import { withTranslation } from 'react-i18next';
import type { WithTranslation } from 'react-i18next';

interface Props extends WithTranslation {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Local Providers Error Boundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { t } = this.props;

      return (
        <div className={classNames('p-6 rounded-lg border border-red-500/20', 'bg-red-500/5 text-center')}>
          <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-red-500 mb-2">{t('local.components.errorBoundary.title')}</h3>
          <p className="text-sm text-red-400 mb-4">{t('local.components.errorBoundary.message')}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className={classNames(
              'px-4 py-2 rounded-lg text-sm font-medium',
              'bg-red-500/10 text-red-500',
              'hover:bg-red-500/20',
              'transition-colors duration-200',
            )}
          >
            {t('local.components.errorBoundary.tryAgain')}
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-red-400 hover:text-red-300">
                {t('local.components.errorBoundary.errorDetails')}
              </summary>
              <pre className="mt-2 p-2 bg-red-500/10 rounded text-xs text-red-300 overflow-auto">
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default withTranslation('providers')(ErrorBoundary);
