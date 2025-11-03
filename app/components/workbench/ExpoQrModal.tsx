import React from 'react';
import { Dialog, DialogTitle, DialogDescription, DialogRoot } from '~/components/ui/Dialog';
import { useStore } from '@nanostores/react';
import { expoUrlAtom } from '~/lib/stores/qrCodeStore';
import { QRCode } from 'react-qrcode-logo';

interface ExpoQrModalProps {
  open: boolean;
  onClose: () => void;
}

export const ExpoQrModal: React.FC<ExpoQrModalProps> = ({ open, onClose }) => {
  const expoUrl = useStore(expoUrlAtom);

  return (
    <DialogRoot open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog
        className="text-center !flex-col !mx-auto !text-center !max-w-md"
        showCloseButton={true}
        onClose={onClose}
      >
        <div className="border !border-bolt-elements-borderColor flex flex-col gap-5 justify-center items-center p-6 bg-bolt-elements-background-depth-2 rounded-md">
          <div className="i-bolt:expo-brand h-10 w-full invert dark:invert-none"></div>
          <DialogTitle className="text-bolt-elements-textTertiary text-lg font-semibold leading-6">
            在您的行動裝置上預覽
          </DialogTitle>
          <DialogDescription className="bg-bolt-elements-background-depth-3 max-w-sm rounded-md p-1 border border-bolt-elements-borderColor">
            使用您行動裝置上的 Expo Go 應用程式掃描此 QR 碼以開啟您的專案。
          </DialogDescription>
          <div className="my-6 flex flex-col items-center">
            {expoUrl ? (
              <QRCode
                logoImage="/favicon.svg"
                removeQrCodeBehindLogo={true}
                logoPadding={3}
                logoHeight={50}
                logoWidth={50}
                logoPaddingStyle="square"
                style={{
                  borderRadius: 16,
                  padding: 2,
                  backgroundColor: '#8a5fff',
                }}
                value={expoUrl}
                size={200}
              />
            ) : (
              <div className="text-gray-500 text-center">未偵測到 Expo URL。</div>
            )}
          </div>
        </div>
      </Dialog>
    </DialogRoot>
  );
};
