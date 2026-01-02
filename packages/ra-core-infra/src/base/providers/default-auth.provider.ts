import { Container, inject } from '@venizia/ignis-inversion';
import { removeDoubleSlashes } from 'ra-core';

import { DefaultAuthService } from '@/base/services';
import {
  AnyType,
  CoreBindings,
  IAuthProvider,
  IAuthProviderOptions,
  IDataProvider,
  RequestMethods,
} from '@/common';
import { BaseProvider } from './base.provider';

export class DefaultAuthProvider<
  TResource extends string = string,
> extends BaseProvider<IAuthProvider> {
  constructor(
    @inject({ key: CoreBindings.DEFAULT_REST_DATA_PROVIDER })
    protected restDataProvider: IDataProvider<TResource>,
    @inject({ key: CoreBindings.AUTH_PROVIDER_OPTIONS })
    protected authProviderOptions: IAuthProviderOptions,
    @inject({ key: CoreBindings.DEFAULT_AUTH_SERVICE })
    protected authService: DefaultAuthService,
  ) {
    super({ scope: DefaultAuthProvider.name });
  }

  // -------------------------------------------------------------
  // LOGIN
  // -------------------------------------------------------------
  login(params: AnyType) {
    return new Promise((resolve, reject) => {
      this.restDataProvider
        .send({
          resource: (this.authProviderOptions.paths?.signIn ?? '/auth/login') as TResource,
          params: { method: RequestMethods.POST, body: params },
        })
        .then(rs => {
          const { userId, token } = rs.data;
          this.authService.saveAuth({ token, userId, username: params.username });
          resolve({
            ...rs,
            redirectTo: removeDoubleSlashes(
              `/${this.authProviderOptions.endpoints?.afterLogin ?? '/'}`,
            ),
          });
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  // -------------------------------------------------------------
  // LOGOUT
  // -------------------------------------------------------------
  logout(_params: AnyType) {
    return new Promise<void>(resolve => {
      this.authService.cleanUp();
      resolve();
    });
  }

  // -------------------------------------------------------------
  // CHECK_AUTH
  // -------------------------------------------------------------
  async checkAuth(_params: AnyType) {
    const token = this.authService.getAuth();

    if (!token?.value) {
      return Promise.reject({ redirectTo: 'login' });
    }

    if (!this.authProviderOptions.paths?.checkAuth) {
      return Promise.resolve();
    }

    const rs = await this.restDataProvider.send({
      resource: this.authProviderOptions.paths.checkAuth as TResource,
      params: { method: RequestMethods.GET },
    });

    if (!rs?.data) {
      return Promise.reject({ redirectTo: 'login' });
    }

    return await Promise.resolve();
  }

  // -------------------------------------------------------------
  // CHECK_ERROR
  // -------------------------------------------------------------
  checkError(params: AnyType) {
    const { status } = params;

    if (status === 401) {
      this.authService.cleanUp();
      return Promise.reject({ redirectTo: 'login' });
    }

    if (status === 403) {
      return Promise.reject({
        redirectTo: `/unauthorized`,
        logoutUser: false,
      });
    }

    return Promise.resolve();
  }

  // -------------------------------------------------------------
  // GET_IDENTIFIER
  // -------------------------------------------------------------
  getIdentity(_params: AnyType) {
    const user = this.authService.getUser();

    if (!user?.userId) {
      return Promise.reject({ message: '[getIdentity] No userId to get user identity!' });
    }

    return Promise.resolve(user);
  }

  // -------------------------------------------------------------
  // GET_PERMISSIONS
  // -------------------------------------------------------------
  getPermissions(_params: AnyType) {
    return Promise.resolve();
  }

  //-------------------------------------------------------------
  // GET_ROLES
  //-------------------------------------------------------------
  getRoles(_params: AnyType) {
    return Promise.resolve(this.authService.getRoles());
  }

  // -------------------------------------------------------------
  override value(_container: Container): IAuthProvider {
    return {
      login: (params: AnyType) => this.login(params),
      logout: (params: AnyType) => this.logout(params),
      checkError: (params: AnyType) => this.checkError(params),
      checkAuth: (params: AnyType) => this.checkAuth(params),
      getIdentity: (params: AnyType) => this.getIdentity(params),
      getPermissions: (params: AnyType) => this.getPermissions(params),
      getRoles: (params: AnyType) => this.getRoles(params),
    };
  }
}
