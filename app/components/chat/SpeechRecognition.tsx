import { IconButton } from '~/components/ui/IconButton';
import { classNames } from '~/utils/classNames';
import React from 'react';
import { useI18n } from '~/i18n/hooks/useI18n';

export const SpeechRecognitionButton = ({
  isListening,
  onStart,
  onStop,
  disabled,
}: {
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled: boolean;
}) => {
  const { t } = useI18n('chat');
  return (
    <IconButton
      title={isListening ? t('speech.stopListening') : t('speech.startRecognition')}
      disabled={disabled}
      className={classNames('transition-all', {
        'text-bolt-elements-item-contentAccent': isListening,
      })}
      onClick={isListening ? onStop : onStart}
    >
      {isListening ? <div className="i-ph:microphone-slash text-xl" /> : <div className="i-ph:microphone text-xl" />}
    </IconButton>
  );
};
