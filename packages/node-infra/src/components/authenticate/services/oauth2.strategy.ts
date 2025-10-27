import { ResultCodes } from '@/common';
import { AxiosNetworkRequest } from '@/helpers/network';
import { getError } from '@/utilities';
import { AuthenticationStrategy, registerAuthenticationStrategy } from '@loopback/authentication';
import { Context } from '@loopback/core';
import { Request } from '@loopback/rest';
import { securityId } from '@loopback/security';
import isEmpty from 'lodash/isEmpty';

export const defineOAuth2Strategy = (opts: {
  name: string;
  requiredAuthProvider?: boolean;
  baseURL: string;
  authPath?: string;
}) => {
  class Strategy implements AuthenticationStrategy {
    name = opts.name;

    authProvider: AxiosNetworkRequest;
    authPath: string;

    constructor() {
      const baseUrl = opts.baseURL;
      if (!baseUrl || isEmpty(baseUrl)) {
        throw getError({
          message: `[RemoteAuthenticationStrategy][DANGER] INVALID baseURL | Missing env: APP_ENV_REMOTE_AUTH_SERVER_URL`,
        });
      }

      this.authPath = opts.authPath ?? '/auth/who-am-i';

      this.authProvider = new AxiosNetworkRequest({
        name: `${Strategy.name}_${opts.name}`,
        networkOptions: { baseUrl },
      });
    }

    async authenticate(request: Request) {
      const networkService = this.authProvider.getNetworkService();

      if (
        opts.requiredAuthProvider &&
        (!request.headers['x-auth-provider'] || request.headers['x-auth-provider'] !== this.name)
      ) {
        throw getError({
          statusCode: ResultCodes.RS_4.Unauthorized,
          message: 'Invaid authorization provider',
        });
      }

      if (!request.headers['authorization']) {
        throw getError({
          statusCode: ResultCodes.RS_4.Unauthorized,
          message: 'No authorization token',
        });
      }

      const rs = await networkService.send({
        url: this.authProvider.getRequestUrl({ paths: [this.authPath] }),
        headers: { Authorization: request.headers['authorization'] },
      });

      if (rs?.data?.error) {
        throw getError(rs.data.error);
      }

      return { ...rs?.data, [securityId]: rs?.data?.userId?.toString() };
    }
  }

  return Strategy;
};

export const registerOAuth2Strategy = (
  context: Context,
  options: {
    strategyName: string;
    requiredAuthProvider?: boolean;
    authenticateUrl: string;
    authenticatePath?: string;
  },
) => {
  const remoteOAuth2Strategy = defineOAuth2Strategy({
    name: options.strategyName,
    requiredAuthProvider: options.requiredAuthProvider,
    baseURL: options.authenticateUrl,
    authPath: options.authenticatePath ?? '/auth/who-am-i',
  });
  registerAuthenticationStrategy(context, remoteOAuth2Strategy);
};
