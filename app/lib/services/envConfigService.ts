/**
 * Environment Configuration Service
 *
 * This service handles reading and writing environment variables to .env.local file.
 * It provides a safe way to persist provider configurations from the UI.
 */

import fs from 'fs/promises';
import path from 'path';

export interface EnvConfig {
  [key: string]: string;
}

export class EnvConfigService {
  private static _envFilePath = path.join(process.cwd(), '.env.local');

  /**
   * Read the current .env.local file and parse it into an object
   */
  static async readEnvFile(): Promise<EnvConfig> {
    try {
      const content = await fs.readFile(this._envFilePath, 'utf-8');
      const config: EnvConfig = {};

      // Parse each line
      content.split('\n').forEach((line) => {
        // Skip comments and empty lines
        const trimmedLine = line.trim();

        if (!trimmedLine || trimmedLine.startsWith('#')) {
          return;
        }

        // Parse KEY=VALUE format
        const equalIndex = trimmedLine.indexOf('=');

        if (equalIndex > 0) {
          const key = trimmedLine.substring(0, equalIndex).trim();
          const value = trimmedLine.substring(equalIndex + 1).trim();
          config[key] = value;
        }
      });

      return config;
    } catch (error: any) {
      // If file doesn't exist, return empty config
      if (error.code === 'ENOENT') {
        return {};
      }

      throw error;
    }
  }

  /**
   * Write environment variables to .env.local file
   * This will merge with existing variables
   */
  static async writeEnvFile(newConfig: EnvConfig): Promise<void> {
    try {
      // Read existing config
      const existingConfig = await this.readEnvFile();

      // Merge configs (new values override existing)
      const mergedConfig = { ...existingConfig, ...newConfig };

      // Build file content
      const lines: string[] = [];

      // Add header comment
      lines.push('# Environment Variables for Bolt.diy');
      lines.push('# Auto-generated and manually configured');
      lines.push('# Last updated: ' + new Date().toISOString());
      lines.push('');

      // Group variables by provider
      const groups: { [prefix: string]: [string, string][] } = {};

      Object.entries(mergedConfig).forEach(([key, value]) => {
        // Determine group by prefix
        let prefix = 'OTHER';

        if (key.startsWith('AZURE_OPENAI_')) {
          prefix = 'AZURE_OPENAI';
        } else if (key.startsWith('OPENAI_')) {
          prefix = 'OPENAI';
        } else if (key.startsWith('ANTHROPIC_')) {
          prefix = 'ANTHROPIC';
        } else if (key.startsWith('GOOGLE_')) {
          prefix = 'GOOGLE';
        } else if (key.startsWith('VITE_')) {
          prefix = 'VITE';
        }

        if (!groups[prefix]) {
          groups[prefix] = [];
        }

        groups[prefix].push([key, value]);
      });

      // Write Azure OpenAI section first
      if (groups.AZURE_OPENAI) {
        lines.push('# Azure OpenAI Configuration');
        groups.AZURE_OPENAI.forEach(([key, value]) => {
          lines.push(`${key}=${value}`);
        });
        lines.push('');
      }

      // Write other provider sections
      const providerOrder = ['OPENAI', 'ANTHROPIC', 'GOOGLE', 'VITE', 'OTHER'];

      providerOrder.forEach((prefix) => {
        if (groups[prefix] && prefix !== 'AZURE_OPENAI') {
          if (prefix === 'OTHER') {
            lines.push('# Other Configuration');
          } else {
            lines.push(`# ${prefix} Configuration`);
          }

          groups[prefix].forEach(([key, value]) => {
            lines.push(`${key}=${value}`);
          });
          lines.push('');
        }
      });

      // Write to file
      await fs.writeFile(this._envFilePath, lines.join('\n'), 'utf-8');
    } catch (error) {
      console.error('Error writing .env.local file:', error);
      throw new Error('Failed to write environment configuration file');
    }
  }

  /**
   * Update specific provider configuration
   */
  static async updateProviderConfig(provider: string, config: Record<string, string>): Promise<void> {
    const envConfig: EnvConfig = {};

    // Convert provider config to env format
    Object.entries(config).forEach(([key, value]) => {
      // Skip empty values
      if (!value || value.trim() === '') {
        return;
      }

      // Construct env variable name
      const envKey = `${provider.toUpperCase()}_${key.toUpperCase()}`;
      envConfig[envKey] = value;
    });

    await this.writeEnvFile(envConfig);
  }

  /**
   * Delete specific environment variables
   */
  static async deleteEnvVariables(keys: string[]): Promise<void> {
    const existingConfig = await this.readEnvFile();

    // Remove specified keys
    keys.forEach((key) => {
      delete existingConfig[key];
    });

    // Rewrite entire file
    const lines: string[] = [];
    lines.push('# Environment Variables for Bolt.diy');
    lines.push('# Last updated: ' + new Date().toISOString());
    lines.push('');

    Object.entries(existingConfig).forEach(([key, value]) => {
      lines.push(`${key}=${value}`);
    });

    await fs.writeFile(this._envFilePath, lines.join('\n'), 'utf-8');
  }

  /**
   * Check if .env.local file exists
   */
  static async envFileExists(): Promise<boolean> {
    try {
      await fs.access(this._envFilePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get Azure OpenAI specific configuration
   */
  static async getAzureOpenAIConfig(): Promise<Record<string, string>> {
    const allConfig = await this.readEnvFile();
    const azureConfig: Record<string, string> = {};

    Object.entries(allConfig).forEach(([key, value]) => {
      if (key.startsWith('AZURE_OPENAI_')) {
        // Remove prefix for easier handling
        const shortKey = key.replace('AZURE_OPENAI_', '').toLowerCase();

        if (shortKey === 'api_key') {
          azureConfig.api_key_masked = this._maskSecret(value);
          return;
        }

        azureConfig[shortKey] = value;
      }
    });

    return azureConfig;
  }

  private static _maskSecret(secret: string) {
    if (!secret) {
      return '';
    }

    const visibleStart = Math.min(4, secret.length);
    const visibleEnd = secret.length > 8 ? 3 : 1;
    const prefix = secret.slice(0, visibleStart);
    const suffix = secret.slice(-visibleEnd);
    const maskedLength = Math.max(secret.length - visibleStart - visibleEnd, 4);

    return `${prefix}${'*'.repeat(maskedLength)}${suffix}`;
  }
}
