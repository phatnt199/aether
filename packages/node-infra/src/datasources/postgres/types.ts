import { IDataSourceOptions } from '@/base/datasources/types';

export interface IPostgresOptions extends IDataSourceOptions {
  connector: 'postgresql';
  host: string;
  port: string | number;
  user: string;
  password: string;
  database: string;
}
