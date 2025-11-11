import { IncomingHttpHeaders } from 'node:http';
import { ParsedUrlQuery } from 'node:querystring';

export interface IHandshake {
  headers: IncomingHttpHeaders;
  time: string;
  address: string;
  xdomain: boolean;
  secure: boolean;
  issued: number;
  url: string;
  query: ParsedUrlQuery;
  auth: {
    [key: string]: any;
  };
}
