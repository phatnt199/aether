import { BaseApplication } from '@/base/applications';
import { BaseComponent } from '@/base/base.component';
import { App } from '@/common';
import { getError, int } from '@/utilities';
import { AuthenticationComponent, registerAuthenticationStrategy } from '@loopback/authentication';
import {
  JWTAuthenticationComponent,
  RefreshTokenServiceBindings,
  TokenServiceBindings,
} from '@loopback/authentication-jwt';
import { Binding, BindingKey, CoreBindings, inject } from '@loopback/core';
import {
  AuthenticateKeys,
  Authentication,
  ChangePasswordRequest,
  IAuthenticateOAuth2Options,
  IAuthenticateRestOptions,
  IAuthenticateTokenOptions,
  SignInRequest,
  SignUpRequest,
} from './common';
import {
  DefaultOAuth2ExpressServer,
  defineAuthController,
  defineOAuth2Controller,
} from './controllers';
import { AuthenticationMiddleware } from './middleware';
import { OAuth2Handler } from './oauth2-handlers';
import {
  OAuth2ClientRepository,
  OAuth2ScopeRepository,
  OAuth2TokenRepository,
} from './repositories';
import {
  BasicAuthenticationStrategy,
  BasicTokenService,
  JWTAuthenticationStrategy,
  JWTTokenService,
  OAuth2Service,
} from './services';

export class AuthenticateComponent extends BaseComponent {
  bindings: Binding[] = [
    Binding.bind<string>(AuthenticateKeys.APPLICATION_SECRET).to(App.APPLICATION_SECRET),

    Binding.bind<IAuthenticateTokenOptions>(AuthenticateKeys.TOKEN_OPTIONS).to({
      tokenSecret: Authentication.ACCESS_TOKEN_SECRET,
      tokenExpiresIn: Authentication.ACCESS_TOKEN_EXPIRES_IN,
      refreshSecret: Authentication.REFRESH_TOKEN_SECRET,
      refreshExpiresIn: Authentication.REFRESH_TOKEN_EXPIRES_IN,
    }),

    Binding.bind(AuthenticateKeys.REST_OPTIONS).to({
      restPath: '/auth',
      serviceKey: 'services.UserService',
      requireAuthenticatedSignUp: false,
      signInRequest: SignInRequest,
      signUpRequest: SignUpRequest,
      changePasswordRequest: ChangePasswordRequest,
    }),
  ];

  constructor(
    @inject(CoreBindings.APPLICATION_INSTANCE)
    protected application: BaseApplication,
  ) {
    super({ scope: AuthenticateComponent.name });
    this.binding();
  }

  defineMiddlewares() {
    this.logger.debug('[defineMiddlewares] Initializing authenticate component - middlewares...!');
    this.application.middleware(AuthenticationMiddleware);
  }

  defineServices() {
    this.logger.debug('[defineServices] Initializing authenticate component - services...!');
    this.application.service(BasicTokenService);
    this.application.service(JWTTokenService);
  }

  defineControllers() {
    const authenticationControllerRestOptions = this.application.isBound(
      AuthenticateKeys.REST_OPTIONS,
    )
      ? this.application.getSync<IAuthenticateRestOptions>(AuthenticateKeys.REST_OPTIONS)
      : {};
    const authenticationController = defineAuthController(authenticationControllerRestOptions);
    this.application.controller(authenticationController);
  }

  defineOAuth2() {
    if (!this.application.isBound(AuthenticateKeys.OAUTH2_OPTIONS)) {
      return;
    }

    const oauth2Options = this.application.getSync<IAuthenticateOAuth2Options>(
      AuthenticateKeys.OAUTH2_OPTIONS,
    );
    const { enable = false, handler, viewFolder } = oauth2Options;
    if (!enable) {
      return;
    }
    this.application.bind(AuthenticateKeys.OAUTH2_HANDLER).to(
      new OAuth2Handler({
        handlerOptions: {
          type: 'authorization_code',
          authServiceKey: handler.authServiceKey,
          injectionGetter: <T>(key: string | BindingKey<T>) => this.application.getSync<T>(key),
          userFetcher: oauth2Options.restOptions?.userFetcher,
        },
        serverOptions: {
          allowEmptyState: true,
          allowBearerTokensInQueryString: true,
          accessTokenLifetime: int(
            this.application.getSync<string>(TokenServiceBindings.TOKEN_EXPIRES_IN) ||
              `${1 * 24 * 60 * 60}`,
          ),
        },
      }),
    );

    /* const strategyName = '<some_name>';
    const remoteOAuth2Strategy = defineOAuth2Strategy({
      name: strategyName,
      baseURL: 'https://domain.com',
      authPath: '/auth/who-am-i',
    });
    registerAuthenticationStrategy(this.application, remoteOAuth2Strategy);
    this.logger.info('[defineOAuth2] Registered auth strategy with name: %s', strategyName); */

    this.application.repository(OAuth2ScopeRepository);
    this.application.repository(OAuth2TokenRepository);
    this.application.repository(OAuth2ClientRepository);

    this.application.service(OAuth2Service);

    const oauth2Controller = defineOAuth2Controller(oauth2Options.restOptions);
    this.application.controller(oauth2Controller);

    this.application.mountExpressRouter(
      oauth2Options.restOptions?.restPath ?? '/oauth2',
      DefaultOAuth2ExpressServer.getInstance({
        useImplicitGrant: oauth2Options.restOptions?.useImplicitGrant,
        viewFolder,
        authServiceKey: handler.authServiceKey,
        injectionGetter: this.application.getInjectionGetter(),
      }).getApplicationHandler(),
    );
  }

  registerComponent() {
    this.application.component(AuthenticationComponent);
    this.application.component(JWTAuthenticationComponent);
    registerAuthenticationStrategy(this.application, JWTAuthenticationStrategy);
    registerAuthenticationStrategy(this.application, BasicAuthenticationStrategy);

    const tokenOptions = this.application.getSync<IAuthenticateTokenOptions>(
      AuthenticateKeys.TOKEN_OPTIONS,
    );

    const {
      tokenSecret = Authentication.ACCESS_TOKEN_SECRET,
      tokenExpiresIn = Authentication.ACCESS_TOKEN_EXPIRES_IN,
      refreshSecret = Authentication.REFRESH_TOKEN_SECRET,
      refreshExpiresIn = Authentication.REFRESH_TOKEN_EXPIRES_IN,
    } = tokenOptions;
    this.application.bind(TokenServiceBindings.TOKEN_SECRET).to(tokenSecret);
    this.application.bind(TokenServiceBindings.TOKEN_EXPIRES_IN).to(tokenExpiresIn.toString());
    this.application.bind(RefreshTokenServiceBindings.REFRESH_SECRET).to(refreshSecret);
    this.application
      .bind(RefreshTokenServiceBindings.REFRESH_EXPIRES_IN)
      .to(refreshExpiresIn?.toString());

    this.defineOAuth2();
  }

  binding() {
    if (!this.application) {
      throw getError({
        statusCode: 500,
        message: '[binding] Invalid application to bind AuthenticateComponent',
      });
    }

    this.logger.info('[binding] Binding authenticate component for application...');

    this.defineServices();
    this.registerComponent();

    this.defineControllers();

    this.defineMiddlewares();
  }
}
