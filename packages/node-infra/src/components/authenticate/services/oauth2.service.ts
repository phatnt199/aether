import { BaseApplication } from '@/base/applications';
import { EnvironmentKeys } from '@/common';
import { AES, applicationEnvironment } from '@/helpers';
import { getError } from '@/utilities';
import { CoreBindings, inject } from '@loopback/core';
import { RequestContext } from '@loopback/rest';
import { Request, Response, Token } from '@node-oauth/oauth2-server';

import { BaseService } from '@/base/services';
import { AuthenticateKeys, IAuthService, SignInRequest } from '../common';
import { OAuth2Handler } from '../oauth2-handlers';
import { OAuth2ClientRepository } from '../repositories';

export class OAuth2Service extends BaseService {
  private aes = AES.withAlgorithm('aes-256-cbc');

  constructor(
    @inject(CoreBindings.APPLICATION_INSTANCE)
    private application: BaseApplication,
    @inject(AuthenticateKeys.OAUTH2_HANDLER) private handler: OAuth2Handler,
    @inject('repositories.OAuth2ClientRepository')
    private oauth2ClientRepository: OAuth2ClientRepository,
  ) {
    super({ scope: OAuth2Service.name });
  }

  // --------------------------------------------------------------------------------
  encryptClientToken(opts: { clientId: string; clientSecret: string }) {
    const { clientId, clientSecret } = opts;
    const applicationSecret = applicationEnvironment.get<string>(
      EnvironmentKeys.APP_ENV_APPLICATION_SECRET,
    );
    return this.aes.encrypt([clientId, clientSecret].join('_'), applicationSecret);
  }

  // --------------------------------------------------------------------------------
  decryptClientToken(opts: { token: string }) {
    const { token } = opts;
    const applicationSecret = applicationEnvironment.get<string>(
      EnvironmentKeys.APP_ENV_APPLICATION_SECRET,
    );

    const decrypted = this.aes.decrypt(token, applicationSecret, { doThrow: false });
    const [clientId, clientSecret] = decrypted.split('_');
    this.logger.debug('[decryptClientToken] Token: %s | ClientId: %s', clientId, token);

    if (!clientId || !clientSecret) {
      this.logger.error('[decryptClientToken] Failed to decrypt token: %s', token);
      throw getError({ message: 'Failed to decryptClientToken' });
    }

    return { clientId, clientSecret };
  }

  // --------------------------------------------------------------------------------
  getOAuth2RequestPath(opts: {
    clientId: string;
    clientSecret: string;
    redirectUrl: string;
  }): Promise<{ requestPath: string }> {
    const { clientId, clientSecret, redirectUrl } = opts;

    return new Promise((resolve, reject) => {
      this.oauth2ClientRepository
        .findOne({ where: { ...opts }, fields: ['id', 'endpoints'] })
        .then(client => {
          if (!client) {
            throw getError({
              message: `[getOAuth2RequestPath] Client not found!`,
            });
          }

          if (!client?.endpoints?.redirectUrls?.includes(redirectUrl)) {
            throw getError({
              message: `[getOAuth2RequestPath] Invalid redirectUrl!`,
            });
          }

          const basePath =
            applicationEnvironment.get<string>(EnvironmentKeys.APP_ENV_SERVER_BASE_PATH) ?? '';
          const applicationSecret = applicationEnvironment.get<string>(
            EnvironmentKeys.APP_ENV_APPLICATION_SECRET,
          );

          if (!applicationSecret) {
            throw getError({
              message: `[getOAuth2RequestPath] Invalid applicationSecret!`,
            });
          }

          const urlParam = new URLSearchParams();

          const requestToken = this.aes.encrypt(
            [clientId, clientSecret].join('_'),
            applicationSecret,
          );
          urlParam.set('c', encodeURIComponent(requestToken));

          if (redirectUrl) {
            urlParam.set('r', encodeURIComponent(redirectUrl));
          }

          resolve({
            requestPath: `${basePath}/oauth2/auth?${urlParam.toString()}`,
          });
        })
        .catch(reject);
    });
  }

  // --------------------------------------------------------------------------------
  generateToken(opts: { request: Request; response: Response }) {
    const { request, response } = opts;
    return this.handler.token(
      new Request({
        ...request,
        headers: request.headers ?? {},
        method: request.method ?? 'get',
        query: request.query ?? {},
      }),
      new Response(response),
    );
  }

  // --------------------------------------------------------------------------------
  authorize(opts: { request: Request; response: Response }) {
    const { request, response } = opts;
    return this.handler.authorize(
      new Request({
        ...request,
        headers: request.headers ?? {},
        method: request.method ?? 'get',
        query: request.query ?? {},
      }),
      new Response(response),
    );
  }

  // --------------------------------------------------------------------------------
  async doOAuth2(opts: {
    context: Pick<RequestContext, 'request' | 'response'>;
    authServiceKey: string;
    signInRequest: SignInRequest;
    redirectUrl?: string;
  }) {
    const { context, authServiceKey, signInRequest, redirectUrl } = opts;

    const authService = this.application.getSync<IAuthService>(authServiceKey);

    const signInRs = await authService.signIn(signInRequest);
    const tokenValue = signInRs?.token?.value;
    if (!tokenValue) {
      throw getError({ message: `[auth] Failed to get token value!` });
    }

    const authorizationCodeRequest = new Request(context.request);
    authorizationCodeRequest.body = {
      client_id: signInRequest.clientId, // eslint-disable-line @typescript-eslint/naming-convention
      response_type: 'code', // eslint-disable-line @typescript-eslint/naming-convention
      grant_type: 'authorization_code', // eslint-disable-line @typescript-eslint/naming-convention
      scope: 'profile',
      access_token: tokenValue, // eslint-disable-line @typescript-eslint/naming-convention
      redirect_uri: redirectUrl, // eslint-disable-line @typescript-eslint/naming-convention
    };

    const authorizationCodeRs = await this.authorize({
      request: authorizationCodeRequest,
      response: new Response(context.response),
    });

    const client = await this.oauth2ClientRepository.findOne({
      where: { clientId: signInRequest.clientId },
      fields: ['id', 'clientId', 'clientSecret'],
    });
    if (!client) {
      throw getError({ message: `[auth] Invalid client to create auth request!` });
    }

    const oauth2TokenRequest = new Request(context.request);
    oauth2TokenRequest.body = {
      client_id: client.clientId, // eslint-disable-line @typescript-eslint/naming-convention
      client_secret: client.clientSecret, // eslint-disable-line @typescript-eslint/naming-convention
      code: authorizationCodeRs.authorizationCode,
      grant_type: 'authorization_code', // eslint-disable-line @typescript-eslint/naming-convention
    };

    if (redirectUrl) {
      oauth2TokenRequest.body.redirect_uri = redirectUrl;
    }

    const oauth2TokenRs = await this.generateToken({
      request: oauth2TokenRequest,
      response: new Response(context.response),
    });

    return {
      redirectUrl: authorizationCodeRs.redirectUri,
      oauth2TokenRs,
    };
  }

  // --------------------------------------------------------------------------------
  async doClientCallback(opts: { c: string; oauth2Token: Token }) {
    const { c, accessToken, authorizationCode, accessTokenExpiresAt, client, user } =
      opts.oauth2Token;

    if (!client) {
      this.logger.error('[doClientCallback] Invalid client | Client: %j', client);
      return;
    }

    const callbackUrls: Array<string> = client?.callbackUrls ?? [];
    if (!callbackUrls.length) {
      this.logger.error('[doClientCallback] No client callbackUrls');
      return;
    }

    const payload = {
      c,
      accessToken,
      authorizationCode,
      accessTokenExpiresAt,
      user,
    };

    await Promise.all(
      callbackUrls.map(callbackUrl => {
        return new Promise((resolve, reject) => {
          fetch(callbackUrl, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { ['content-type']: 'application/x-www-form-urlencoded' },
          })
            .then(rs => {
              this.logger.info('[doClientCallback] Successfull to callback | Url: %s', callbackUrl);
              resolve(rs);
            })
            .catch(error => {
              this.logger.error(
                '[doClientCallback] Failed to callback | Url: %s | Error: %s',
                callbackUrl,
                error,
              );
              reject(error);
            });
        });
      }),
    );
  }
}
