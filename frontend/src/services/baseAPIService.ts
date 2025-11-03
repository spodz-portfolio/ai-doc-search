export abstract class BaseAPIService {
  protected baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.REACT_APP_API_URL || 'http://localhost:3001';
  }

  protected async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage: string;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
        } catch {
          errorMessage = `HTTP error! status: ${response.status}. Response: ${errorText.substring(0, 200)}...`;
        }
        
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      
      try {
        return JSON.parse(responseText) as T;
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  protected async makeStreamRequest(
    endpoint: string,
    options: RequestInit,
    onChunk: (chunk: any) => void
  ): Promise<void> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              onChunk(data);
              
              if (data.done || data.error) {
                return;
              }
            } catch (parseError) {
              console.warn('Error parsing stream data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Stream API Error for ${endpoint}:`, error);
      throw error;
    }
  }
}