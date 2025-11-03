import { IMessageService, ISource } from '../types/interfaces';

export class MessageService implements IMessageService {
  generateUniqueId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  formatMessage(content: string, sources?: ISource[]): string {
    if (!sources || sources.length === 0) {
      return content;
    }

    const sourcesText = sources
      .map((source, index) => 
        `[${index + 1}] ${source.documentTitle} (${Math.round(source.similarity * 100)}% match)`
      )
      .join('\n');

    return `${content}\n\nSources:\n${sourcesText}`;
  }

  formatTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    
    return timestamp.toLocaleDateString();
  }

  formatTime(timestamp: Date): string {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}