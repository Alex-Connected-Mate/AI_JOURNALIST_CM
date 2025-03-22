import { useStore } from './store';

const logger = {
  error: (message: string, error?: any) => {
    const errorMessage = `[ERROR] ${message}${error ? ` ${JSON.stringify(error)}` : ''}`;
    console.error(errorMessage);
    return errorMessage;
  },

  info: (message: string) => {
    console.log(`[INFO] ${message}`);
  },

  warning: (message: string) => {
    console.warn(`[WARNING] ${message}`);
  }
};

export type Logger = typeof logger;
export default logger; 