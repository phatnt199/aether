import { ApplicationLogger, LoggerFactory } from '@/helpers';
import OAuth2Server, { ServerOptions } from '@node-oauth/oauth2-server';

import { TInjectionGetter } from '@/common';
import { getError } from '@/utilities';
import { OAuth2AuthorizationCodeHandler } from './authorization-code.handler';
import { IOAuth2AuthenticationHandler } from './base';

export class OAuth2Handler extends OAuth2Server {
  logger: ApplicationLogger;

  constructor(opts: {
    scope?: string;
    handlerOptions: {
      type: 'authorization_code';
      authServiceKey: string;
      injectionGetter: TInjectionGetter;
    };
    serverOptions: Omit<ServerOptions, 'model'>;
  }) {
    const { scope, handlerOptions, serverOptions } = opts;

    let authHandler: IOAuth2AuthenticationHandler | null = null;
    const { type: authType, authServiceKey } = handlerOptions;

    switch (authType) {
      case 'authorization_code': {
        authHandler = new OAuth2AuthorizationCodeHandler({
          authServiceKey,
          injectionGetter: handlerOptions.injectionGetter,
        });
        break;
      }
      default: {
        break;
      }
    }

    if (!authHandler) {
      throw getError({ message: '[defineOAuth2] Invalid OAuth2 model handler!' });
    }

    super({ ...serverOptions, model: authHandler });
    this.logger = LoggerFactory.getLogger([scope ?? OAuth2Handler.name]);
  }
}
