import { BaseDataSource } from '@/base/datasources';
import { IdType } from '@/common';
import { ApplicationLogger, LoggerFactory } from '@/helpers';
import { getError } from '@/utilities';
import { BindingScope, inject, injectable } from '@loopback/core';

import { Enforcer, newCachedEnforcer, newEnforcer } from 'casbin';
import isEmpty from 'lodash/isEmpty';
import fs from 'node:fs';

import { CasbinAdapterBuilder } from '../adapters';
import {
  AuthorizerKeys,
  CasbinAdapterTypes,
  IAuthorizeConfigureOptions,
  IEnforcerFilterValue,
} from '../common';

@injectable({ scope: BindingScope.SINGLETON })
export class EnforcerService {
  private logger: ApplicationLogger;

  private enforcer: Enforcer;

  constructor(
    @inject(AuthorizerKeys.CONFIGURE_OPTIONS)
    protected options: IAuthorizeConfigureOptions,
    @inject(AuthorizerKeys.AUTHORIZE_DATASOURCE)
    protected dataSource: BaseDataSource,
  ) {
    this.logger = LoggerFactory.getLogger([EnforcerService.name]);
    this.logger.info('[getEnforcer] Initialize enforcer with options: %j', this.options);
  }

  getEnforcer(): Promise<Enforcer> {
    if (this.enforcer) {
      return Promise.resolve(this.enforcer);
    }

    this.logger.debug('[getEnforcer] Enforcer Options: %j', this.options);
    const { confPath, adapterType = CasbinAdapterTypes.POSTGRES, adapter, useCache } = this.options;

    if (!confPath || isEmpty(confPath)) {
      this.logger.error('[getEnforcer] Invalid configure path | confPath: %s', confPath);
      throw getError({
        statusCode: 500,
        message: `[getEnforcer] Invalid enforcer configuration path | confPath: ${confPath}`,
      });
    }

    if (!fs.existsSync(confPath)) {
      this.logger.error('[getEnforcer] Please check again configure path | confPath: %s', confPath);
      throw getError({
        statusCode: 500,
        message: `[getEnforcer] Enforcer configuration path is not existed | confPath: ${confPath}`,
      });
    }

    this.logger.info(
      '[getEnforcer] Creating new Enforcer with configure path: %s | dataSource: %s',
      confPath,
      this.dataSource.name,
    );

    const casbinAdapter =
      adapter ??
      CasbinAdapterBuilder.getInstance().build({
        type: adapterType,
        dataSource: this.dataSource,
      });

    if (useCache) {
      return newCachedEnforcer(confPath, casbinAdapter);
    }

    this.logger.debug('[getEnforcer] Created new enforcer | Configure path: %s', confPath);
    return newEnforcer(confPath, casbinAdapter);
  }

  // -----------------------------------------------------------------------------------------
  async getTypeEnforcer(id: IdType) {
    const enforcer = await this.getEnforcer();
    if (!enforcer) {
      return null;
    }

    const filterValue: IEnforcerFilterValue = {
      principalType: 'User',
      principalValue: id,
    };

    await enforcer.loadFilteredPolicy(filterValue);
    return enforcer;
  }
}
