import { createClient } from '@supabase/supabase-js';

// Type definitions
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogCategory = 'app' | 'auth' | 'database' | 'component' | 'api';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
}

type LogSubscriber = (log: string) => void;

// Logger class with subscription support
class Logger {
  private subscribers: LogSubscriber[] = [];
  private enabled: boolean = true;
  private logToConsole: boolean = true;
  private logToStorage: boolean = true;
  private logToSupabase: boolean = false;
  private supabaseClient: any = null;
  private userId: string | null = null;
  private sessionId: string | null = null;
  private deviceInfo: any = null;
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.deviceInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenSize: `${window.screen.width}x${window.screen.height}`
      };
    }
  }

  // Method to subscribe to logs
  subscribe(callback: LogSubscriber): void {
    if (typeof callback !== 'function') {
      console.error('Logger.subscribe requires a function callback');
      return;
    }
    this.subscribers.push(callback);
  }

  // Method to unsubscribe from logs
  unsubscribe(callback: LogSubscriber): void {
    this.subscribers = this.subscribers.filter(sub => sub !== callback);
  }

  // Configuration methods
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setLogToConsole(enabled: boolean): void {
    this.logToConsole = enabled;
  }

  setLogToStorage(enabled: boolean): void {
    this.logToStorage = enabled;
  }

  setLogToSupabase(enabled: boolean, client?: any): void {
    this.logToSupabase = enabled;
    if (client) {
      this.supabaseClient = client;
    } else if (enabled && !this.supabaseClient) {
      // Initialize Supabase client if not provided
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      this.supabaseClient = createClient(supabaseUrl, supabaseKey);
    }
  }

  setUser(userId: string | null): void {
    this.userId = userId;
  }

  setSession(sessionId: string | null): void {
    this.sessionId = sessionId;
  }

  // Logging methods
  private log(level: LogLevel, category: LogCategory, message: string, data?: any): void {
    if (!this.enabled) return;

    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      category,
      message,
      data
    };

    // Format the log message
    const formattedMessage = this.formatLogMessage(logEntry);

    // Notify subscribers
    this.notifySubscribers(formattedMessage);

    // Output to console
    if (this.logToConsole) {
      this.outputToConsole(logEntry, formattedMessage);
    }

    // Save to local storage
    if (this.logToStorage) {
      this.saveToStorage(formattedMessage);
    }

    // Send to Supabase
    if (this.logToSupabase && this.supabaseClient) {
      this.sendToSupabase(logEntry);
    }
  }

  private formatLogMessage(logEntry: LogEntry): string {
    const { timestamp, level, category, message, data } = logEntry;
    const time = timestamp.split('T')[1].split('.')[0];
    let formattedMessage = `[${time}] [${level.toUpperCase()}] [${category}] ${message}`;
    
    if (data) {
      try {
        if (typeof data === 'object') {
          formattedMessage += ` ${JSON.stringify(data)}`;
        } else {
          formattedMessage += ` ${data}`;
        }
      } catch (error) {
        formattedMessage += ' [Error serializing data]';
      }
    }

    return formattedMessage;
  }

  private notifySubscribers(message: string): void {
    this.subscribers.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('Error in log subscriber:', error);
      }
    });
  }

  private outputToConsole(logEntry: LogEntry, formattedMessage: string): void {
    const { level } = logEntry;
    
    switch (level) {
      case 'debug':
        console.debug(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }

  private saveToStorage(message: string): void {
    if (typeof window === 'undefined') return;

    try {
      const logs = this.getLogsFromStorage();
      logs.push(message);
      
      // Keep only the last 500 logs
      const trimmedLogs = logs.slice(-500);
      localStorage.setItem('app_logs', JSON.stringify(trimmedLogs));
    } catch (error) {
      console.error('Error saving log to storage:', error);
    }
  }

  private getLogsFromStorage(): string[] {
    if (typeof window === 'undefined') return [];

    try {
      const storedLogs = localStorage.getItem('app_logs');
      return storedLogs ? JSON.parse(storedLogs) : [];
    } catch (error) {
      console.error('Error reading logs from storage:', error);
      return [];
    }
  }

  private sendToSupabase(logEntry: LogEntry): void {
    if (!this.supabaseClient) return;

    const { timestamp, level, category, message, data } = logEntry;
    
    this.supabaseClient
      .from('logs')
      .insert({
        timestamp,
        level,
        category,
        message,
        data,
        user_id: this.userId,
        session_id: this.sessionId,
        device_info: this.deviceInfo
      })
      .then((result: any) => {
        if (result.error) {
          console.error('Error sending log to Supabase:', result.error);
        }
      })
      .catch((error: any) => {
        console.error('Error sending log to Supabase:', error);
      });
  }

  // Public logging interfaces
  debug(message: string, data?: any): void {
    this.log('debug', 'app', message, data);
  }

  info(message: string, data?: any): void {
    this.log('info', 'app', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', 'app', message, data);
  }

  error(message: string, data?: any): void {
    this.log('error', 'app', message, data);
  }

  // Category-specific logging
  auth(level: LogLevel, message: string, data?: any): void {
    this.log(level, 'auth', message, data);
  }

  database(level: LogLevel, message: string, data?: any): void {
    this.log(level, 'database', message, data);
  }

  component(component: string, action: string, data?: any): void {
    this.log('info', 'component', `${component} ${action}`, data);
  }

  api(level: LogLevel, endpoint: string, message: string, data?: any): void {
    this.log(level, 'api', `${endpoint} - ${message}`, data);
  }

  // Function to get all logs from storage
  getAllLogs(): string[] {
    return this.getLogsFromStorage();
  }

  // Function to clear logs from storage
  clearLogs(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('app_logs');
  }

  // Method to add a global toggle logs listener
  setupLogToggle(): void {
    if (typeof window === 'undefined') return;
    
    // Create a custom event for toggling logs
    window.addEventListener('keydown', (event) => {
      // Toggle logs when Alt+L is pressed
      if (event.altKey && event.key === 'l') {
        window.dispatchEvent(new CustomEvent('toggle-logs'));
      }
    });
  }
}

// Create a singleton logger instance
const logger = new Logger();

// Setup toggle logs (Alt+L) if in browser environment
if (typeof window !== 'undefined') {
  logger.setupLogToggle();
}

export default logger;
export { Logger }; 