import { EnvironmentKeys, IdType, TInjectionGetter } from '@/common';
import { applicationEnvironment } from '@/helpers';
import { getSchemaObject } from '@/utilities';
import { authenticate } from '@loopback/authentication';
import { Context, Getter, inject } from '@loopback/core';
import {
  api,
  ExpressServerConfig,
  get,
  post,
  requestBody,
  RequestContext,
  RestBindings,
} from '@loopback/rest';
import { SecurityBindings } from '@loopback/security';
import { Request, Response } from '@node-oauth/oauth2-server';

import { OAuth2Service } from '../services';

import { AbstractExpressRequestHandler, BaseController } from '@/base/controllers';
import isEmpty from 'lodash/isEmpty';
import { join } from 'node:path';
import { Authentication, IAuthenticateOAuth2RestOptions, OAuth2Request } from '../common';

interface IOAuth2ControllerOptions {
  config?: ExpressServerConfig | undefined;
  context?: Context;
  injectionGetter: TInjectionGetter;
  authServiceKey: string;
  viewFolder?: string;
}

// --------------------------------------------------------------------------------
export class DefaultOAuth2ExpressServer extends AbstractExpressRequestHandler {
  private static instance: DefaultOAuth2ExpressServer;

  private authServiceKey: string;
  private viewFolder?: string;

  constructor(opts: IOAuth2ControllerOptions) {
    super({
      ...opts,
      scope: DefaultOAuth2ExpressServer.name,
    });

    this.authServiceKey = opts.authServiceKey;
    this.viewFolder = opts.viewFolder;

    this.binding();
  }

  static getInstance(opts: IOAuth2ControllerOptions) {
    if (!this.instance) {
      this.instance = new DefaultOAuth2ExpressServer(opts);
      return this.instance;
    }

    return this.instance;
  }

  binding() {
    this.expressApp.set('view engine', 'ejs');

    const oauth2ViewFolder =
      this.viewFolder ??
      applicationEnvironment.get<string>(EnvironmentKeys.APP_ENV_OAUTH2_VIEW_FOLDER) ??
      join(__dirname, '../', 'views');
    this.expressApp.set('views', oauth2ViewFolder);
    this.logger.info('[binding] View folder: %s', oauth2ViewFolder);

    const basePath =
      applicationEnvironment.get<string>(EnvironmentKeys.APP_ENV_SERVER_BASE_PATH) ?? '';
    const authAction = `${basePath}/oauth2/auth`;
    this.logger.info('[binding] Auth action path: %s', authAction);

    // -----------------------------------------------------------------------------------------------------------------
    this.expressApp.get('/auth', (request, response) => {
      const { c, r } = request.query;

      if (!c) {
        response.render('pages/auth', {
          message: 'Invalid client credential | Please verify query params!',
          payload: {},
        });
        return;
      }

      const payload = {
        title: `${applicationEnvironment.get<string>(EnvironmentKeys.APP_ENV_APPLICATION_NAME)} OAuth`,
        action: authAction,
        c: decodeURIComponent(c.toString()),
        r: decodeURIComponent(r?.toString() ?? ''),
      };

      response.render('pages/auth', {
        message: 'Please fill out your credential!',
        payload,
      });
    });

    // -----------------------------------------------------------------------------------------------------------------
    this.expressApp.post('/auth', (request, response) => {
      const { username, password, token, redirectUrl } = request.body;

      const requiredProps = [
        { key: 'username', value: username },
        { key: 'password', value: username },
        { key: 'token', value: username },
        { key: 'redirectUrl', value: username },
      ];
      for (const prop of requiredProps) {
        if (prop?.value && !isEmpty(prop?.value)) {
          continue;
        }

        this.logger.error(
          '[oauth2][post] Missing prop: %s | key: %s | value: %s',
          prop.key,
          prop.key,
          prop.value,
        );
        response.render('pages/error', {
          message: `Missing prop ${prop.key} | Please check again authentication form | Make sure username, password, token and redirectUrl parameters are all available in form!`,
        });
        return;
      }

      const oauth2Service = this.injectionGetter<OAuth2Service>('services.OAuth2Service');

      const decryptedClient = oauth2Service.decryptClientToken({ token });
      oauth2Service
        .doOAuth2({
          context: { request, response },
          authServiceKey: this.authServiceKey,
          signInRequest: {
            identifier: { scheme: 'username', value: username },
            credential: { scheme: 'basic', value: password },
            clientId: decryptedClient.clientId,
          },
          redirectUrl,
        })
        .then(rs => {
          const { accessToken, accessTokenExpiresAt, client } = rs.oauth2TokenRs;

          if (!accessTokenExpiresAt) {
            response.render('pages/error', {
              message: 'Failed to validate accessToken expiration | Please try to request again!',
            });
            return;
          }

          oauth2Service
            .doClientCallback({ c: token, oauth2Token: rs.oauth2TokenRs })
            .then(() => {
              const url = new URL(rs.redirectUrl);
              url.searchParams.append('c', encodeURIComponent(token));
              url.searchParams.append('clientId', client.clientId);
              url.searchParams.append('accessToken', accessToken);
              response.redirect(url.toString());
            })
            .catch(error => {
              throw error;
            });
        })
        .catch(error => {
          response.render('pages/error', {
            message: `${error?.message ?? 'Failed to authenticate'} | Please try to request again!`,
          });
        });
    });
  }
}

// --------------------------------------------------------------------------------
export const defineOAuth2Controller = (opts?: IAuthenticateOAuth2RestOptions) => {
  const {
    restPath = '/oauth2',
    tokenPath = '/token',
    authorizePath = '/authorize',
    oauth2ServiceKey = 'services.OAuth2Service',

    // authStrategy = { name: `${applicationEnvironment.get<string>(EnvironmentKeys.APP_ENV_APPLICATION_NAME)}_oauth2` },
  } = opts ?? {};

  @api({ basePath: restPath })
  class BaseOAuth2Controller extends BaseController {
    service: OAuth2Service;
    getCurrentUser: Getter<{ userId: IdType }>;
    httpContext: RequestContext;

    constructor(
      authService: OAuth2Service,
      getCurrentUser: Getter<{ userId: IdType }>,
      httpContext: RequestContext,
    ) {
      super({ scope: BaseOAuth2Controller.name });
      this.service = authService;
      this.getCurrentUser = getCurrentUser;
      this.httpContext = httpContext;
    }

    // ------------------------------------------------------------------------------
    @authenticate(Authentication.STRATEGY_JWT)
    @get('/who-am-i')
    whoami() {
      return this.getCurrentUser();
    }

    // ------------------------------------------------------------------------------
    @post(tokenPath)
    generateToken() {
      const { request, response } = this.httpContext;
      return this.service.generateToken({
        request: new Request(request),
        response: new Response(response),
      });
    }

    // ------------------------------------------------------------------------------
    @post(authorizePath)
    authorize() {
      const { request, response } = this.httpContext;
      return this.service.authorize({
        request: new Request(request),
        response: new Response(response),
      });
    }

    // ------------------------------------------------------------------------------
    @post('/request')
    getOAuth2RequestPath(
      @requestBody({
        required: true,
        content: {
          'application/json': {
            schema: getSchemaObject(OAuth2Request),
          },
        },
      })
      payload: OAuth2Request,
    ) {
      return this.service.getOAuth2RequestPath(payload);
    }
  }

  inject(oauth2ServiceKey)(BaseOAuth2Controller, undefined, 0);
  inject.getter(SecurityBindings.USER, { optional: true })(BaseOAuth2Controller, undefined, 1);
  inject(RestBindings.Http.CONTEXT)(BaseOAuth2Controller, undefined, 2);

  return BaseOAuth2Controller;
};
