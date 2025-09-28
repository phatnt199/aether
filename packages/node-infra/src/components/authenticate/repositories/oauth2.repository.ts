import { BaseDataSource } from '@/base/datasources';
import { TzCrudRepository } from '@/base/repositories';
import { Getter, inject } from '@loopback/core';
import { OAuth2Client, OAuth2Scope, OAuth2Token } from '../models';

import { IdType } from '@/common';
import { getError } from '@/utilities';
import { BelongsToAccessor, repository } from '@loopback/repository';
import isEmpty from 'lodash/isEmpty';

const DS_OAUTH2 = process.env.APP_ENV_APPLICATION_DS_OAUTH2
  ? process.env.APP_ENV_APPLICATION_DS_OAUTH2
  : process.env.APP_ENV_APPLICATION_DS_AUTHORIZE;

export class OAuth2ClientRepository extends TzCrudRepository<OAuth2Client> {
  constructor(@inject(`datasources.${DS_OAUTH2}`) dataSource: BaseDataSource) {
    if (!DS_OAUTH2 || isEmpty(DS_OAUTH2)) {
      throw getError({
        message: `[AUTHORIZE][DANGER] INVALID DATABASE CONFIGURE | Missing env: DS_AUTHORIZE`,
      });
    }

    super(OAuth2Client, dataSource);
  }
}

export class OAuth2ScopeRepository extends TzCrudRepository<OAuth2Scope> {
  constructor(@inject(`datasources.${DS_OAUTH2}`) dataSource: BaseDataSource) {
    if (!DS_OAUTH2 || isEmpty(DS_OAUTH2)) {
      throw getError({
        message: `[AUTHORIZE][DANGER] INVALID DATABASE CONFIGURE | Missing env: DS_AUTHORIZE`,
      });
    }

    super(OAuth2Scope, dataSource);
  }
}

export class OAuth2TokenRepository extends TzCrudRepository<OAuth2Token> {
  public readonly client: BelongsToAccessor<OAuth2Client, IdType>;

  constructor(
    @inject(`datasources.${DS_OAUTH2}`) dataSource: BaseDataSource,
    @repository.getter('OAuth2ScopeRepository')
    protected oauth2ClientRepository: Getter<OAuth2ClientRepository>,
  ) {
    if (!DS_OAUTH2 || isEmpty(DS_OAUTH2)) {
      throw getError({
        message: `[AUTHORIZE][DANGER] INVALID DATABASE CONFIGURE | Missing env: DS_AUTHORIZE`,
      });
    }

    super(OAuth2Token, dataSource);

    this.client = this.createBelongsToAccessorFor('client', oauth2ClientRepository);
    this.registerInclusionResolver('client', this.client.inclusionResolver);
  }
}
