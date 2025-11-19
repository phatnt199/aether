import { IdType, TInjectionGetter } from '@/common';
import { getError } from '@/utilities';
import { Client, ClientCredentialsModel, Falsey, User } from '@node-oauth/oauth2-server';
import { IAuthService, IOAuth2User } from '../common';
import { AbstractOAuth2AuthenticationHandler } from './base';

export class OAuth2ClientCredentialHandler
  extends AbstractOAuth2AuthenticationHandler
  implements ClientCredentialsModel
{
  constructor(opts: {
    scope?: string;
    authServiceKey: string;
    injectionGetter: TInjectionGetter;
    serviceKey: string;
    userFetcher?: (userId: IdType) => Promise<IOAuth2User | null>;
  }) {
    super({
      scope: opts.scope,
      authServiceKey: opts.authServiceKey,
      injectionGetter: opts.injectionGetter,
      userFetcher: opts.userFetcher,
    });
  }

  getUserFromClient(client: Client): Promise<User | Falsey> {
    this.logger.debug('[getUserFromClient] Client: %j', client);
    const service = this.injectionGetter<IAuthService>(this.authServiceKey);

    if (!service?.getUserInformation) {
      throw getError({
        message: `${this.authServiceKey} has no 'getUserInformation' method!`,
      });
    }

    const userInformation = service?.getUserInformation?.(client);
    return Promise.resolve(userInformation);
  }
}
