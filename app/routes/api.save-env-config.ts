import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { EnvConfigService } from '~/lib/services/envConfigService';

/**
 * API endpoint for saving environment configuration to .env.local
 *
 * POST /api/save-env-config
 * Body: {
 *   provider: string,  // e.g., "azure_openai", "openai"
 *   config: {
 *     api_key: string,
 *     endpoint?: string,
 *     resource_name?: string,
 *     deployment_name?: string,
 *     api_version?: string,
 *   }
 * }
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    // Only allow POST requests
    if (request.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    // Parse request body
    const body = (await request.json()) as { provider?: string; config?: Record<string, string> };
    const { provider, config } = body;

    // Validate input
    if (!provider || typeof provider !== 'string') {
      return Response.json({ error: 'Provider is required' }, { status: 400 });
    }

    if (!config || typeof config !== 'object') {
      return Response.json({ error: 'Config object is required' }, { status: 400 });
    }

    // Security check: only allow whitelisted providers
    const allowedProviders = [
      'azure_openai',
      'openai',
      'anthropic',
      'google',
      'groq',
      'mistral',
      'cohere',
      'deepseek',
      'together',
      'xai',
      'perplexity',
    ];

    if (!allowedProviders.includes(provider.toLowerCase())) {
      return Response.json({ error: 'Provider not allowed' }, { status: 403 });
    }

    // Update provider configuration
    await EnvConfigService.updateProviderConfig(provider, config);

    return Response.json({
      success: true,
      message: 'Configuration saved successfully to .env.local',
      note: 'Please restart the development server for changes to take effect',
    });
  } catch (error: any) {
    console.error('Error saving environment configuration:', error);

    return Response.json(
      {
        error: 'Failed to save configuration',
        message: error.message || 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * GET endpoint to retrieve current configuration
 */
export async function loader({ request }: ActionFunctionArgs) {
  try {
    const url = new URL(request.url);
    const provider = url.searchParams.get('provider');

    if (!provider) {
      // Return all configuration
      const allConfig = await EnvConfigService.readEnvFile();
      return Response.json({ config: allConfig });
    }

    // Return specific provider configuration
    if (provider.toLowerCase() === 'azure_openai') {
      const azureConfig = await EnvConfigService.getAzureOpenAIConfig();
      return Response.json({ config: azureConfig });
    }

    // For other providers, filter by prefix
    const allConfig = await EnvConfigService.readEnvFile();
    const providerPrefix = provider.toUpperCase().replace(/_/g, '_');
    const providerConfig: Record<string, string> = {};

    Object.entries(allConfig).forEach(([key, value]) => {
      if (key.startsWith(providerPrefix)) {
        providerConfig[key] = value;
      }
    });

    return Response.json({ config: providerConfig });
  } catch (error: any) {
    console.error('Error reading environment configuration:', error);

    return Response.json(
      {
        error: 'Failed to read configuration',
        message: error.message || 'Unknown error',
      },
      { status: 500 },
    );
  }
}
