export interface ISwaggerOptions {
  restOptions: {
    path: {
      base: string;
      doc: string;
      ui: string;
    };
  };
  explorer: {
    openapi: string;
    info: {
      title: string;
      version: string;
      description: string;
    };
    servers?: Array<{
      url: string;
      description?: string;
    }>;
  };
}
