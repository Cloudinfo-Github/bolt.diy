import { useSearchParams } from '@remix-run/react';
import { generateId, type UIMessage as Message } from 'ai';
import ignore from 'ignore';
import { useEffect, useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { useGit } from '~/lib/hooks/useGit';
import { useChatHistory } from '~/lib/persistence';
import { createCommandsMessage, detectProjectCommands, escapeBoltTags } from '~/utils/projectCommands';
import { LoadingOverlay } from '~/components/ui/LoadingOverlay';
import { toast } from 'react-toastify';
import { useI18n } from '~/i18n/hooks/useI18n';

const IGNORE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  '.github/**',
  '.vscode/**',
  '**/*.jpg',
  '**/*.jpeg',
  '**/*.png',
  'dist/**',
  'build/**',
  '.next/**',
  'coverage/**',
  '.cache/**',
  '.vscode/**',
  '.idea/**',
  '**/*.log',
  '**/.DS_Store',
  '**/npm-debug.log*',
  '**/yarn-debug.log*',
  '**/yarn-error.log*',

  // Include this so npm install runs much faster '**/*lock.json',
  '**/*lock.yaml',
];

export function GitUrlImport() {
  const { t } = useI18n('repository');
  const [searchParams] = useSearchParams();
  const { ready: historyReady, importChat } = useChatHistory();
  const { ready: gitReady, gitClone } = useGit();
  const [imported, setImported] = useState(false);
  const [loading, setLoading] = useState(true);

  const importRepo = async (repoUrl?: string) => {
    if (!gitReady && !historyReady) {
      return;
    }

    if (repoUrl) {
      const ig = ignore().add(IGNORE_PATTERNS);

      try {
        const { workdir, data } = await gitClone(repoUrl);

        if (importChat) {
          const filePaths = Object.keys(data).filter((filePath) => !ig.ignores(filePath));
          const textDecoder = new TextDecoder('utf-8');

          const fileContents = filePaths
            .map((filePath) => {
              const { data: content, encoding } = data[filePath];
              return {
                path: filePath,
                content:
                  encoding === 'utf8' ? content : content instanceof Uint8Array ? textDecoder.decode(content) : '',
              };
            })
            .filter((f) => f.content);

          const commands = await detectProjectCommands(fileContents);
          const commandsMessage = createCommandsMessage(commands);

          const filesMessage: Message = {
            role: 'assistant',
            id: generateId(),
            parts: [
              {
                type: 'text',
                text: `Cloning the repo ${repoUrl} into ${workdir}
<boltArtifact id="imported-files" title="${t('gitClone.clonedFiles')}"  type="bundled">
${fileContents
  .map(
    (file) =>
      `<boltAction type="file" filePath="${file.path}">
${escapeBoltTags(file.content)}
</boltAction>`,
  )
  .join('\n')}
</boltArtifact>`,
              },
            ],
          };

          const messages: Message[] = [filesMessage];

          if (commandsMessage) {
            messages.push({
              role: 'user',
              id: generateId(),
              parts: [{ type: 'text', text: 'Setup the codebase and Start the application' }],
            });
            messages.push(commandsMessage);
          }

          await importChat(`${t('gitClone.gitProject')}:${repoUrl.split('/').slice(-1)[0]}`, messages, {
            gitUrl: repoUrl,
          });
        }
      } catch (error) {
        console.error('Error during import:', error);
        toast.error(t('gitClone.failedToImport'));
        setLoading(false);
        window.location.href = '/';

        return;
      }
    }
  };

  useEffect(() => {
    if (!historyReady || !gitReady || imported) {
      return;
    }

    const url = searchParams.get('url');

    if (!url) {
      window.location.href = '/';
      return;
    }

    importRepo(url).catch((error) => {
      console.error('Error importing repo:', error);
      toast.error('Failed to import repository');
      setLoading(false);
      window.location.href = '/';
    });
    setImported(true);
  }, [searchParams, historyReady, gitReady, imported]);

  return (
    <ClientOnly fallback={<BaseChat />}>
      {() => (
        <>
          <Chat />
          {loading && <LoadingOverlay message={t('gitClone.cloningRepository')} />}
        </>
      )}
    </ClientOnly>
  );
}
