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
export declare const config: AppConfig;
export {};
