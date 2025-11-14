export const REASONING_ANNOTATION_TYPE = 'reasoning' as const;
export const USAGE_ANNOTATION_TYPE = 'usage' as const;

export type CodeContextAnnotation = {
  type: 'codeContext';
  files: string[];
};

export type ChatSummaryAnnotation = {
  type: 'chatSummary';
  summary: string;
  chatId: string;
};

export type ReasoningAnnotation = {
  type: typeof REASONING_ANNOTATION_TYPE;
  summary: string;

  /** Optional metadata for debugging or analytics */
  provider?: string;
  model?: string;
};

export type UsageAnnotation = {
  type: typeof USAGE_ANNOTATION_TYPE;
  value: {
    completionTokens: number;
    promptTokens: number;
    totalTokens: number;
  };
};

export type ContextAnnotation = CodeContextAnnotation | ChatSummaryAnnotation | ReasoningAnnotation | UsageAnnotation;

export type ProgressAnnotation = {
  type: 'progress';
  label: string;
  status: 'in-progress' | 'complete';
  order: number;
  message: string;
};

export type ToolCallAnnotation = {
  type: 'toolCall';
  toolCallId: string;
  serverName: string;
  toolName: string;
  toolDescription: string;
};
