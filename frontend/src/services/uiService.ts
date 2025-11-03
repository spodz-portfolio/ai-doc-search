import { IUIService } from '../types/interfaces';

export class UIService implements IUIService {
  scrollToBottom(element: React.RefObject<HTMLElement>): void {
    element.current?.scrollIntoView({ behavior: 'smooth' });
  }

  adjustTextareaHeight(textarea: React.RefObject<HTMLTextAreaElement>): void {
    if (textarea.current) {
      textarea.current.style.height = 'auto';
      textarea.current.style.height = Math.min(textarea.current.scrollHeight, 120) + 'px';
    }
  }

  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  validateFileType(file: File, allowedTypes: string[]): boolean {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    return allowedTypes.includes(`.${fileExtension}`);
  }

  validateFileSize(file: File, maxSizeInMB: number): boolean {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  }
}