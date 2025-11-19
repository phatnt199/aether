import { IdType, TInjectionGetter } from '@/common';
import {
  AuthorizationCode,
  AuthorizationCodeModel,
  Client,
  Falsey,
  User,
} from '@node-oauth/oauth2-server';
import { AuthenticationTokenTypes, IOAuth2User } from '../common';
import { AbstractOAuth2AuthenticationHandler } from './base';

export class OAuth2AuthorizationCodeHandler
  extends AbstractOAuth2AuthenticationHandler
  implements AuthorizationCodeModel
{
  constructor(opts: {
    scope?: string;
    authServiceKey: string;
    injectionGetter: TInjectionGetter;
    userFetcher?: (userId: IdType) => Promise<IOAuth2User | null>;
  }) {
    super({
      scope: opts.scope,
      authServiceKey: opts.authServiceKey,
      injectionGetter: opts.injectionGetter,
      userFetcher: opts.userFetcher,
    });
  }

  getAuthorizationCode(authorizationCode: string): Promise<AuthorizationCode | Falsey> {
    return new Promise((resolve, reject) => {
      this._getToken({
        type: AuthenticationTokenTypes.TYPE_AUTHORIZATION_CODE,
        token: authorizationCode,
      })
        .then(rs => {
          const { token: oauth2Token, client, user } = rs;
          resolve({
            authorizationCode: oauth2Token.token,
            expiresAt: new Date(oauth2Token.details?.expiresAt),
            redirectUri: oauth2Token.details?.redirectUri,
            scope: oauth2Token.scopes,
            client: { ...client, id: client.id.toString() },
            user,
          });
        })
        .catch(reject);
    });
  }

  saveAuthorizationCode(
    code: Pick<
      AuthorizationCode,
      | 'authorizationCode'
      | 'expiresAt'
      | 'redirectUri'
      | 'scope'
      | 'codeChallenge'
      | 'codeChallengeMethod'
    >,
    client: Client,
    user: User,
  ): Promise<AuthorizationCode | Falsey> {
    return new Promise((resolve, reject) => {
      this._saveToken({
        token: code.authorizationCode,
        type: AuthenticationTokenTypes.TYPE_AUTHORIZATION_CODE,
        client,
        user,
        details: code,
      })
        .then(() => {
          resolve({ ...code, client, user });
        })
        .catch(reject);
    });
  }

  revokeAuthorizationCode(code: AuthorizationCode): Promise<boolean> {
    this.logger.debug('[revokeAuthorizationCode] Revoked code: %j', code);
    return Promise.resolve(true);
  }
}
