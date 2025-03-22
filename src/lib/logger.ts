// Type definitions
interface Logger {
  subscribe: (callback: (log: string) => void) => void;
  unsubscribe: (callback: (log: string) => void) => void;
  notify: (log: string) => void;
  info: (message: string, data?: any) => void;
  warning: (message: string, data?: any) => void;
  error: (message: string, error?: any) => void;
  debug: (message: string, data?: any) => void;
  session: (message: string, data?: any) => void;
  component: (componentName: string, event: string, props?: any) => void;
}

// Subscribers array
let subscribers: ((log: string) => void)[] = [];

const logger: Logger = {
  // Subscribe to logs
  subscribe: (callback: (log: string) => void) => {
    subscribers.push(callback);
  },

  // Unsubscribe from logs
  unsubscribe: (callback: (log: string) => void) => {
    subscribers = subscribers.filter(sub => sub !== callback);
  },

  // Notify all subscribers
  notify: (log: string) => {
    subscribers.forEach(sub => sub(log));
  },

  // Existing logging methods
  info: (message: string, data?: any) => {
    const log = `[INFO] ${message}${data ? ` ${JSON.stringify(data)}` : ''}`;
    console.log(log);
    logger.notify(log);
  },

  warning: (message: string, data?: any) => {
    const log = `[WARNING] ${message}${data ? ` ${JSON.stringify(data)}` : ''}`;
    console.warn(log);
    logger.notify(log);
  },

  error: (message: string, error?: any) => {
    const log = `[ERROR] ${message}${error ? ` ${JSON.stringify(error)}` : ''}`;
    console.error(log);
    logger.notify(log);
  },

  debug: (message: string, data?: any) => {
    const log = `[DEBUG] ${message}${data ? ` ${JSON.stringify(data)}` : ''}`;
    console.debug(log);
    logger.notify(log);
  },

  session: (message: string, data?: any) => {
    const log = `[SESSION] ${message}${data ? ` ${JSON.stringify(data)}` : ''}`;
    console.log(log);
    logger.notify(log);
  },

  component: (componentName: string, event: string, props?: any) => {
    const log = `[COMPONENT] ${componentName} - ${event}${props ? ` ${JSON.stringify(props)}` : ''}`;
    console.log(log);
    logger.notify(log);
  }
};

export type { Logger };
export default logger; 