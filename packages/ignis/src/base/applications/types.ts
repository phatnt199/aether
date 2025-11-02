export interface IApplicationConfig {
  port?: number;
  host?: string;
  basePath?: string;
  cors?: boolean;
  autoLoad: {
    dirs: Record<
      string, // folder name | namespace
      string // folder path from basePath
    >;
  };
  [key: string]: any;
}
