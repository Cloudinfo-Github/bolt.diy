import type { Tool } from 'ai';
import { useI18n } from '~/i18n/hooks/useI18n';

type ParameterProperty = {
  type?: string;
  description?: string;
};

type ToolParameters = {
  jsonSchema: {
    properties?: Record<string, ParameterProperty>;
    required?: string[];
  };
};

type McpToolProps = {
  toolName: string;
  toolSchema: Tool;
};

export default function McpServerListItem({ toolName, toolSchema }: McpToolProps) {
  const { t } = useI18n('settings');

  if (!toolSchema) {
    return null;
  }

  const toolParameters = (toolSchema as { parameters?: ToolParameters }).parameters;
  const parameters: Record<string, ParameterProperty> = toolParameters?.jsonSchema?.properties ?? {};
  const requiredParams = toolParameters?.jsonSchema?.required ?? [];

  return (
    <div className="mt-2 ml-4 p-3 rounded-md bg-bolt-elements-background-depth-2 text-xs">
      <div className="flex flex-col gap-1.5">
        <h3 className="text-bolt-elements-textPrimary font-semibold truncate" title={toolName}>
          {toolName}
        </h3>

        <p className="text-bolt-elements-textSecondary">{toolSchema.description || t('mcp.server.noDescription')}</p>

        {Object.keys(parameters).length > 0 && (
          <div className="mt-2.5">
            <h4 className="text-bolt-elements-textSecondary font-semibold mb-1.5">{t('mcp.server.parameters')}:</h4>
            <ul className="ml-1 space-y-2">
              {Object.entries(parameters).map(([paramName, paramDetails]) => (
                <li key={paramName} className="break-words">
                  <div className="flex items-start">
                    <span className="font-medium text-bolt-elements-textPrimary">
                      {paramName}
                      {requiredParams.includes(paramName) && (
                        <span className="text-red-600 dark:text-red-400 ml-1">*</span>
                      )}
                    </span>

                    <span className="mx-2 text-bolt-elements-textSecondary">•</span>

                    <div className="flex-1">
                      {paramDetails?.type && (
                        <span className="text-bolt-elements-textSecondary italic">{paramDetails.type}</span>
                      )}
                      {paramDetails?.description && (
                        <div className="mt-0.5 text-bolt-elements-textSecondary">{paramDetails.description}</div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
