import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface ServerConfig {
  port: number;
  nodeEnv: string;
}

interface ApiKeysConfig {
  openai: string | undefined;
  googleServiceAccount: string | undefined;
  googleCredentialsPath: string | undefined;
}

interface SecurityConfig {
  rateLimitWindow: number;
  rateLimitMax: number;
  corsOrigins: string[];
}

interface OpenAIConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  embeddingModel: string;
}

interface RagConfig {
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
  minSimilarity: number;
  maxContextLength: number;
}

interface AppConfig {
  server: ServerConfig;
  apiKeys: ApiKeysConfig;
  security: SecurityConfig;
  openai: OpenAIConfig;
  rag: RagConfig;
  validate(): void;
}

/**
 * Application configuration
 */
export const config: AppConfig = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development'
  },

  // API Keys
  apiKeys: {
    openai: process.env.OPENAI_API_KEY,
    googleServiceAccount: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
    googleCredentialsPath: process.env.GOOGLE_CREDENTIALS_PATH
  },

  // Security settings
  security: {
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    corsOrigins: process.env.NODE_ENV === 'production' 
      ? (process.env.FRONTEND_URLS || '').split(',').filter(Boolean)
      : ['http://localhost:3000', 'http://127.0.0.1:3000']
  },

  // OpenAI settings
  openai: {
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000', 10),
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'
  },

  // RAG settings
  rag: {
    chunkSize: parseInt(process.env.RAG_CHUNK_SIZE || '1000', 10),
    chunkOverlap: parseInt(process.env.RAG_CHUNK_OVERLAP || '200', 10),
    topK: parseInt(process.env.RAG_TOP_K || '5', 10),
    minSimilarity: parseFloat(process.env.RAG_MIN_SIMILARITY || '0.7'),
    maxContextLength: parseInt(process.env.RAG_MAX_CONTEXT_LENGTH || '4000', 10)
  },

  // Validation
  validate(): void {
    const required = [
      { key: 'OPENAI_API_KEY', value: this.apiKeys.openai }
    ];

    const missing = required.filter(({ value }) => !value);
    
    if (missing.length > 0) {
      const keys = missing.map(({ key }) => key).join(', ');
      throw new Error(`Missing required environment variables: ${keys}`);
    }

    console.log('✅ Configuration validated successfully');
  }
};

// Validate configuration on import
config.validate();