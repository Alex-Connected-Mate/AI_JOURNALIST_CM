declare const logger: {
  info: (message: string, data?: any) => void;
  warning: (message: string, data?: any) => void;
  error: (message: string, error?: any) => void;
  debug: (message: string, data?: any) => void;
  session: (message: string, data?: any) => void;
  component: (componentName: string, event: string, props?: any) => void;
};

export default logger; 