import { TInjectionGetter } from '@/common';
import {
  AuthorizationCode,
  AuthorizationCodeModel,
  Client,
  Falsey,
  User,
} from '@node-oauth/oauth2-server';
import { AuthenticationTokenTypes } from '../common';
import { AbstractOAuth2AuthenticationHandler } from './base';

export class OAuth2AuthorizationCodeHandler
  extends AbstractOAuth2AuthenticationHandler
  implements AuthorizationCodeModel
{
  constructor(opts: { scope?: string; authServiceKey: string; injectionGetter: TInjectionGetter }) {
    super({
      scope: opts.scope,
      authServiceKey: opts.authServiceKey,
      injectionGetter: opts.injectionGetter,
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

  async saveAuthorizationCode(
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
    // Extract scopes from code
    const scopeValue: string | string[] | undefined = code.scope as string | string[] | undefined;
    let requestedScopes: string[];
    if (Array.isArray(scopeValue)) {
      requestedScopes = scopeValue.filter(Boolean);
    } else if (typeof scopeValue === 'string' && scopeValue.trim() !== '') {
      requestedScopes = scopeValue.split(' ').filter(Boolean);
    } else {
      requestedScopes = [];
    }

    // Validate scopes against configuration
    const validationResult = await this.validateScopes(requestedScopes);

    if (!validationResult.valid) {
      this.logger.warn(
        '[OAuth2 Scope] Invalid scopes requested | Requested: %s | Invalid: %s',
        requestedScopes.join(', '),
        validationResult.invalidScopes?.join(', ') ?? 'N/A',
      );
      // Optionally reject invalid scopes, or just use granted ones
      // For now, we'll use only the granted scopes
    }

    const scopes = validationResult.grantedScopes;
    this.logger.debug(
      '[OAuth2 Scope] Saving code: %s for client: %s and user: %s with scopes: %s',
      code.authorizationCode,
      client.id,
      user,
      scopes.join(', ') || '(none - will use defaults)',
    );

    await this._saveToken({
      token: code.authorizationCode,
      type: AuthenticationTokenTypes.TYPE_AUTHORIZATION_CODE,
      client,
      user,
      scopes,
      details: code,
    });

    return { ...code, client, user };
  }

  revokeAuthorizationCode(code: AuthorizationCode): Promise<boolean> {
    this.logger.debug('[revokeAuthorizationCode] Revoked code: %j', code);
    return Promise.resolve(true);
  }
}
