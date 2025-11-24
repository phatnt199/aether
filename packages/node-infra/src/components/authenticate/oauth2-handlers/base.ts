import { AnyObject, OAuth2TokenStatuses, TInjectionGetter } from '@/common';
import { ApplicationLogger, LoggerFactory } from '@/helpers';
import { getError, int } from '@/utilities';
import { securityId } from '@loopback/security';
import {
  BaseModel,
  Client,
  Falsey,
  RequestAuthenticationModel,
  Token,
  User,
} from '@node-oauth/oauth2-server';

import get from 'lodash/get';
import {
  AuthenticateKeys,
  Authentication,
  AuthenticationTokenTypes,
  IAuthenticateOAuth2Options,
  IAuthService,
  IScopeValidationResult,
} from '../common';
import { OAuth2Client, OAuth2Token } from '../models';
import { OAuth2ClientRepository, OAuth2TokenRepository } from '../repositories';
import { JWTTokenService } from '../services';
import { UserDataFetcher } from './data';
import { ScopeManager } from './scope';

export interface IOAuth2AuthenticationHandler extends BaseModel, RequestAuthenticationModel {}

export abstract class AbstractOAuth2AuthenticationHandler implements IOAuth2AuthenticationHandler {
  protected authServiceKey: string;
  protected logger: ApplicationLogger;
  protected injectionGetter: TInjectionGetter;
  protected scopeManager: ScopeManager;
  protected userDataFetcher: UserDataFetcher;

  constructor(opts: { scope?: string; authServiceKey: string; injectionGetter: TInjectionGetter }) {
    this.logger = LoggerFactory.getLogger([
      opts?.scope ?? AbstractOAuth2AuthenticationHandler.name,
    ]);
    this.injectionGetter = opts.injectionGetter;
    this.authServiceKey = opts.authServiceKey;

    this.initializeServices();
  }

  private initializeServices(): void {
    const oauth2Options = this.injectionGetter<IAuthenticateOAuth2Options>(
      AuthenticateKeys.OAUTH2_OPTIONS,
    );

    const availableScopes = oauth2Options?.restOptions?.availableScopes ?? [];
    const defaultScopes = oauth2Options?.restOptions?.defaultScopes ?? [];

    // Initialize scope manager
    this.scopeManager = new ScopeManager(
      availableScopes,
      defaultScopes,
      `${this.constructor.name}:ScopeManager`,
    );

    // Initialize user data fetcher
    this.userDataFetcher = new UserDataFetcher(
      {
        injectionGetter: this.injectionGetter,
        scopeManager: this.scopeManager,
      },
      `${this.constructor.name}:UserDataFetcher`,
    );

    this.logger.info('[initializeServices] Services initialized successfully');
  }

  getClient(clientId: string, clientSecret: string): Promise<Client | Falsey> {
    return new Promise((resolve, reject) => {
      this.logger.debug('[getClient] Retrieving application client | client_id: %s', clientId);

      const clientRepository = this.injectionGetter<OAuth2ClientRepository>(
        'repositories.OAuth2ClientRepository',
      );

      clientRepository
        .findOne({
          where: { or: [{ clientId }, { clientId, clientSecret }] },
          fields: [
            'id',
            'provider',
            'identifier',
            'clientId',
            'name',
            'description',
            'grants',
            'userId',
            'endpoints',
          ],
        })
        .then(oauth2Client => {
          if (!oauth2Client) {
            reject(
              getError({
                message: `[getClient] OAuth2 client NOT FOUND | clientId: ${clientId}`,
              }),
            );
            return;
          }

          resolve({
            id: oauth2Client.id.toString(),
            provider: oauth2Client.provider,
            identifier: oauth2Client.identifier,
            clientId: oauth2Client.clientId,
            name: oauth2Client.name,
            description: oauth2Client.description,
            grants: oauth2Client.grants,
            userId: oauth2Client.userId,
            redirectUris: oauth2Client?.endpoints?.redirectUrls ?? [],
            callbackUrls: oauth2Client?.endpoints?.callbackUrls ?? [],
          });
        })
        .catch(reject);
    });
  }

  async generateAccessToken(client: Client, user: User, scopes: string[]): Promise<string> {
    const service = this.injectionGetter<JWTTokenService>('services.JWTTokenService');

    const userId = get(user, 'id');

    if (!userId) {
      throw getError({
        message:
          '[generateAccessToken] Invalid userId | Please verify getUserInformation response!',
      });
    }

    const authService = this.injectionGetter<IAuthService>(this.authServiceKey);
    const userInformation = await authService?.getUserInformation?.({ userId });

    const tokenValue = service.generate({
      payload: {
        [securityId]: userId.toString(),
        userId: userInformation?.userId ?? userId.toString(),
        roles: userInformation?.roles ?? [],
        provider: client.provider,
        clientId: client.id,
        scopes,
      },
    });

    return Promise.resolve(tokenValue);
  }

  protected _saveToken(opts: {
    type: string;
    token: string;
    client: Client;
    user: User;
    details?: AnyObject;
    scopes?: string[];
  }): Promise<OAuth2Token | null> {
    const { type, token, client, user, details, scopes } = opts;
    const oauth2TokenRepository = this.injectionGetter<OAuth2TokenRepository>(
      'repositories.OAuth2TokenRepository',
    );

    return oauth2TokenRepository.create({
      token,
      type,
      status: OAuth2TokenStatuses.ACTIVATED,
      clientId: int(client.id),
      userId: int(user.id),
      scopes: scopes ?? [],
      details,
    });
  }

  saveToken(token: Token, client: Client, user: User): Promise<Token | Falsey> {
    return new Promise((resolve, reject) => {
      const scopes = this.scopeManager.normalizeScopes(token.scope);

      this._saveToken({
        token: token.accessToken,
        type: AuthenticationTokenTypes.TYPE_ACCESS_TOKEN,
        client,
        user,
        scopes,
        details: token,
      })
        .then(() => {
          resolve({ ...token, client, user });
        })
        .catch(reject);
    });
  }

  async _getToken(opts: { type: string; token: string }) {
    const { type, token } = opts;

    const oauth2TokenRepository = this.injectionGetter<OAuth2TokenRepository>(
      'repositories.OAuth2TokenRepository',
    );

    const oauth2Token: OAuth2Token | null = await oauth2TokenRepository.findOne({
      where: { type, token },
    });

    if (!oauth2Token) {
      this.logger.error('[_getToken] Not found OAuth2Token | type: %s | token: %s', type, token);
      throw getError({
        message: `[_getToken] Not found any OAuth2Token with type: ${type} | token: ${token}`,
      });
    }

    if (oauth2Token.status !== OAuth2TokenStatuses.ACTIVATED) {
      this.logger.error('[_getToken] Invalid OAuth2Token status | token: %j', oauth2Token);
      throw getError({
        message: `[_getToken] Invalid OAuth2Token status: ${oauth2Token.status}`,
      });
    }

    // Fetch user data using UserDataFetcher
    const userId = int(oauth2Token.userId);
    const grantedScopes = oauth2Token.scopes ?? [];

    const user = await this.userDataFetcher.fetchByScopes({ userId, grantedScopes });

    if (!user?.id) {
      this.logger.error(
        '[_getToken] Not found User | type: %s | token: %s | oauth2Token: %j',
        type,
        token,
        oauth2Token,
      );
      throw getError({
        message: `[_getToken] Not found any User with type: ${type} | token: ${token}`,
      });
    }

    const oauth2ClientRepository = this.injectionGetter<OAuth2ClientRepository>(
      'repositories.OAuth2ClientRepository',
    );
    const oauth2Client = await oauth2ClientRepository.findOne({
      where: { id: int(oauth2Token.clientId) },
      fields: ['id', 'provider', 'identifier', 'clientId', 'name', 'description', 'userId'],
    });

    if (!oauth2Client) {
      this.logger.error(
        '[_getToken] Not found OAuth2Client | type: %s | token: %s | oauth2Token: %j',
        type,
        token,
        oauth2Token,
      );
      throw getError({
        message: `[_getToken] Not found any OAuth2Client with type: ${type} | token: ${token}`,
      });
    }

    return {
      token: oauth2Token,
      client: oauth2Client,
      user,
    };
  }

  async getAccessToken(accessToken: string): Promise<Token | Falsey> {
    const service = this.injectionGetter<JWTTokenService>('services.JWTTokenService');
    const tokenPayload = service.verify({
      type: Authentication.TYPE_BEARER,
      token: accessToken,
    });

    const clientId = tokenPayload['clientId'];

    if (!clientId || clientId === 'NA') {
      this.logger.error(
        '[getAccessToken] Invalid clientId in tokenPayload | tokenPayload: %j',
        tokenPayload,
      );
      throw getError({
        message: '[getAccessToken] Invalid clientId in token payload!',
      });
    }

    const oauth2ClientRepository = this.injectionGetter<OAuth2ClientRepository>(
      'repositories.OAuth2ClientRepository',
    );
    const oauth2Client = await oauth2ClientRepository.findOne({
      where: { clientId },
      fields: ['id', 'provider', 'identifier', 'clientId', 'name', 'description', 'userId'],
    });

    if (!oauth2Client) {
      throw getError({
        message: `[getAccessToken] Not found any OAuth2Client with id: ${clientId}`,
      });
    }

    return {
      accessToken,
      accessTokenExpiresAt: new Date(int(tokenPayload['exp']) * 1000),
      scope: tokenPayload['scopes'],
      client: Object.assign({}, oauth2Client!.toObject() as OAuth2Client, {
        id: oauth2Client.id.toString(),
      }),
      user: { id: tokenPayload.userId },
    };
  }

  verifyScope(token: Token, requiredScopes: string[]): Promise<boolean> {
    return new Promise(resolve => {
      this.logger.info('[verifyScope] Token: %j | Required scopes: %s', token, requiredScopes);

      if (!token) {
        resolve(false);
        return;
      }

      // If no scopes required, allow access
      if (!requiredScopes || requiredScopes.length === 0) {
        resolve(true);
        return;
      }

      const tokenScopes = this.scopeManager.normalizeScopes(token.scope);

      // Check if token has all required scopes
      const hasAllScopes = requiredScopes.every(scope => tokenScopes.includes(scope));

      this.logger.info(
        '[verifyScope] Token scopes: %s | Has all required scopes: %s',
        tokenScopes.join(', '),
        hasAllScopes,
      );

      resolve(hasAllScopes);
    });
  }

  async validateScopes(requestedScopes: string[]): Promise<IScopeValidationResult> {
    return this.scopeManager.validateScopes(requestedScopes);
  }

  protected getScopeManager(): ScopeManager {
    return this.scopeManager;
  }

  protected getUserDataFetcher(): UserDataFetcher {
    return this.userDataFetcher;
  }
}
