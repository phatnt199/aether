import { TInjectionGetter } from '@/common';
import { Client, Falsey, PasswordModel, User } from '@node-oauth/oauth2-server';
import { IAuthService } from '../common';
import { AbstractOAuth2AuthenticationHandler } from './base';

export class OAuth2PasswordHandler
  extends AbstractOAuth2AuthenticationHandler
  implements PasswordModel
{
  constructor(opts: {
    scope?: string;
    authServiceKey: string;
    injectionGetter: TInjectionGetter;
    serviceKey: string;
  }) {
    super({
      scope: opts.scope,
      authServiceKey: opts.authServiceKey,
      injectionGetter: opts.injectionGetter,
    });
  }

  getUser(username: string, password: string, _client: Client): Promise<User | Falsey> {
    const service = this.injectionGetter<IAuthService>(this.authServiceKey);
    return service.signIn({
      identifier: { scheme: 'username', value: username },
      credential: { scheme: 'basic', value: password },
    });
  }
}
