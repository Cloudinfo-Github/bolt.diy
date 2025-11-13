/*
 * Maximum tokens for response generation (updated for modern model capabilities)
 * This serves as a fallback when model-specific limits are unavailable
 * Modern models like Claude 3.5, GPT-4o, and Gemini Pro support 128k+ tokens
 */
export const MAX_TOKENS = 128000;

/*
 * Provider-specific default completion token limits
 * Used as fallbacks when model doesn't specify maxCompletionTokens
 */
export const PROVIDER_COMPLETION_LIMITS: Record<string, number> = {
  OpenAI: 4096, // Standard GPT models (o1 models have much higher limits)
  Github: 4096, // GitHub Models use OpenAI-compatible limits
  Anthropic: 64000, // Conservative limit for Claude 4 models (Opus: 32k, Sonnet: 64k)
  Google: 8192, // Gemini 1.5 Pro/Flash standard limit
  Cohere: 4000,
  DeepSeek: 8192,
  Groq: 8192,
  HuggingFace: 4096,
  Mistral: 8192,
  Ollama: 8192,
  OpenRouter: 8192,
  Perplexity: 8192,
  Together: 8192,
  xAI: 8192,
  LMStudio: 8192,
  OpenAILike: 8192,
  AmazonBedrock: 8192,
  Hyperbolic: 8192,
};

/*
 * Reasoning models that require maxCompletionTokens instead of maxTokens
 * These models use internal reasoning tokens and have different API parameter requirements
 *
 * Supported reasoning models:
 * - OpenAI: o1, o3, o4, gpt-5 series
 * - DeepSeek: DeepSeek-R1, DeepSeek-V3 series, MAI-DS-R1
 * - xAI: grok-4-fast-reasoning
 * - Phi: Phi-4-reasoning, Phi-4-mini-reasoning
 */
export function isReasoningModel(modelName: string): boolean {
  // First check for explicit non-reasoning patterns
  if (/non-reasoning/i.test(modelName)) {
    return false;
  }

  // DeepSeek-R1-0528 supports tools, so exclude it from reasoning models
  if (/deepseek-r1-0528/i.test(modelName)) {
    return false;
  }

  const reasoningPatterns = [
    /^o[1-4]/i, // o1, o2, o3, o4 系列
    /^gpt-5/i, // GPT-5 系列
    /deepseek-r1/i, // DeepSeek-R1 (原版，不支援 tools)
    /deepseek-v3/i, // DeepSeek-V3 系列
    /mai-ds-r1/i, // Microsoft AI DeepSeek R1
    /grok-.*-reasoning/i, // Grok reasoning 系列
    /phi-.*-reasoning/i, // Phi reasoning 系列
  ];

  const result = reasoningPatterns.some((pattern) => pattern.test(modelName));

  // DEBUG: Test regex matching
  console.log(`REGEX TEST: "${modelName}" matches reasoning pattern: ${result}`);

  return result;
}

// limits the number of model responses that can be returned in a single request
export const MAX_RESPONSE_SEGMENTS = 2;

export interface File {
  type: 'file';
  content: string;
  isBinary: boolean;
  isLocked?: boolean;
  lockedByFolder?: string;
}

export interface Folder {
  type: 'folder';
  isLocked?: boolean;
  lockedByFolder?: string;
}

type Dirent = File | Folder;

export type FileMap = Record<string, Dirent | undefined>;

export const IGNORE_PATTERNS = [
  'node_modules/**',
  '.git/**',
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
  '**/*lock.json',
  '**/*lock.yml',
];
