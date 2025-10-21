import { BaseDataSource } from '@/base/datasources';
import { TBaseTzEntity } from '@/base/models';
import { TzCrudRepository, ViewRepository } from '@/base/repositories';
import { EntityClassType, IdType } from '@/common';
import { getError } from '@/utilities';
import { Getter, inject } from '@loopback/core';
import { HasManyThroughRepositoryFactory, repository } from '@loopback/repository';

import { Permission, PermissionMapping, Role, UserRole, ViewAuthorizePolicy } from '../models';

import isEmpty from 'lodash/isEmpty';

const DS_AUTHORIZE = process.env.APP_ENV_APPLICATION_DS_AUTHORIZE;

// ----------------------------------------------------------------------------
export abstract class AbstractAuthorizeRepository<
  T extends TBaseTzEntity,
> extends TzCrudRepository<T> {
  constructor(entityClass: EntityClassType<T>, dataSource: BaseDataSource) {
    if (!DS_AUTHORIZE || isEmpty(DS_AUTHORIZE)) {
      throw getError({
        message: `[AUTHORIZE][DANGER] INVALID DATABASE CONFIGURE | Missing env: DS_AUTHORIZE`,
      });
    }

    super(entityClass, dataSource);
    this.bindingRelations();
  }

  abstract bindingRelations(): void;
}

// ----------------------------------------------------------------------------
export class RoleRepository extends AbstractAuthorizeRepository<Role> {
  public readonly permissions: HasManyThroughRepositoryFactory<
    Permission,
    IdType,
    PermissionMapping,
    IdType
  >;

  constructor(
    @inject(`datasources.${DS_AUTHORIZE}`) dataSource: BaseDataSource,
    @repository.getter('PermissionRepository')
    protected permissionRepositoryGetter: Getter<PermissionRepository>,
    @repository.getter('PermissionMappingRepository')
    protected permissionMappingRepositoryGetter: Getter<PermissionMappingRepository>,
  ) {
    super(Role, dataSource);

    this.permissions = this.createHasManyThroughRepositoryFactoryFor(
      'permissions',
      permissionRepositoryGetter,
      permissionMappingRepositoryGetter,
    );
    this.registerInclusionResolver('permissions', this.permissions.inclusionResolver);
  }

  bindingRelations(): void {}
}

// ----------------------------------------------------------------------------
export class PermissionRepository extends AbstractAuthorizeRepository<Permission> {
  constructor(@inject(`datasources.${DS_AUTHORIZE}`) dataSource: BaseDataSource) {
    super(Permission, dataSource);
  }

  bindingRelations(): void {}
}

// ----------------------------------------------------------------------------
export class PermissionMappingRepository extends AbstractAuthorizeRepository<PermissionMapping> {
  constructor(@inject(`datasources.${DS_AUTHORIZE}`) dataSource: BaseDataSource) {
    super(PermissionMapping, dataSource);
  }

  bindingRelations(): void {}
}

// ----------------------------------------------------------------------------
export class UserRoleRepository extends AbstractAuthorizeRepository<UserRole> {
  constructor(@inject(`datasources.${DS_AUTHORIZE}`) dataSource: BaseDataSource) {
    super(UserRole, dataSource);
  }

  bindingRelations(): void {}
}

// ----------------------------------------------------------------------------
export class ViewAuthorizePolicyRepository extends ViewRepository<ViewAuthorizePolicy> {
  constructor(@inject(`datasources.${DS_AUTHORIZE}`) dataSource: BaseDataSource) {
    super(ViewAuthorizePolicy, dataSource);
  }
}
