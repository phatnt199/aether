import isEmpty from 'lodash/isEmpty';

import { NetworkHelper } from '@/helpers';
import { getError } from '@/utilities';

export abstract class BaseNetworkRequestService {
  protected baseUrl: string;
  protected networkService: NetworkHelper;

  constructor(opts: { name: string; scope: string; baseUrl?: string }) {
    const { name, baseUrl } = opts;

    this.baseUrl = baseUrl ?? '';
    this.networkService = new NetworkHelper({ name });
  }

  getRequestPath(opts: { paths: Array<string> }) {
    const paths = opts?.paths ?? [];

    const joined = paths
      .map((path: string) => {
        if (!path.startsWith('/')) {
          path = `/${path}`; // Add / to the start of url path
        }

        return path;
      })
      .join('');

    return joined;
  }

  getRequestUrl(opts: { baseUrl?: string; paths: Array<string> }) {
    let baseUrl = opts?.baseUrl ?? this.baseUrl ?? '';
    const paths = opts?.paths ?? [];

    if (!baseUrl || isEmpty(baseUrl)) {
      throw getError({
        statusCode: 500,
        message:
          '[getRequestUrl] Invalid configuration for third party request base url!',
      });
    }

    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1); // Remove / at the end
    }

    const joined = this.getRequestPath({ paths });
    return `${baseUrl ?? this.baseUrl}${joined}`;
  }

  getNetworkService() {
    return this.networkService;
  }
}
