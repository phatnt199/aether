import { AxiosResponse } from 'axios';

export type TFetcherVariant = 'node-fetch' | 'axios';
export type TFetcherResponse<T extends TFetcherVariant> = T extends 'node-fetch'
  ? Response
  : AxiosResponse;
