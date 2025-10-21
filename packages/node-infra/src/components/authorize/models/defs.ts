import { BaseNumberTzEntity } from '@/base';
import { AnyObject, RoleStatuses, UserStatuses, UserTypes } from '@/common';
import { PrincipalMixin } from '@/mixins';
import { property } from '@loopback/repository';

// -----------------------------------------------------------------------
export const defineUser = () => {
  class User extends BaseNumberTzEntity {
    @property({
      type: 'string',
    })
    realm?: string;

    @property({
      type: 'string',
      default: UserStatuses.UNKNOWN,
      postgresql: {
        columnName: 'status',
        dataType: 'text',
      },
    })
    status: string;

    @property({
      type: 'string',
      default: UserTypes.SYSTEM,
      postgresql: {
        columnName: 'user_type',
        dataType: 'text',
      },
    })
    userType?: string;

    @property({
      type: 'date',
      postgresql: {
        columnName: 'activated_at',
        dataType: 'TIMESTAMPTZ',
      },
    })
    activatedAt?: Date;

    @property({
      type: 'date',
      postgresql: {
        columnName: 'last_login_at',
        dataType: 'TIMESTAMPTZ',
      },
    })
    lastLoginAt?: Date;

    @property({
      type: 'number',
      postgresql: {
        columnName: 'parent_id',
      },
    })
    parentId: number;

    constructor(data?: Partial<User>) {
      super(data);
    }
  }

  return User;
};

// -----------------------------------------------------------------------
export const defineRole = () => {
  class Role extends BaseNumberTzEntity {
    @property({
      type: 'string',
      require: true,
    })
    identifier: string;

    @property({
      type: 'string',
      require: true,
    })
    name: string;

    @property({
      type: 'string',
    })
    description?: string;

    @property({
      type: 'number',
    })
    priority: number;

    @property({
      type: 'string',
      default: RoleStatuses.ACTIVATED,
    })
    status: string;

    constructor(data?: Partial<Role>) {
      super(data);
    }
  }

  return Role;
};

// -----------------------------------------------------------------------
export const definePermission = <T extends AnyObject = AnyObject>() => {
  class Permission extends BaseNumberTzEntity {
    @property({
      type: 'string',
    })
    code: string;

    @property({
      type: 'string',
    })
    name: string;

    @property({
      type: 'string',
    })
    subject: string;

    @property({
      type: 'string',
      postgresql: { columnName: 'p_type' },
    })
    pType: string;

    @property({
      type: 'string',
    })
    action: string;

    @property({
      type: 'string',
    })
    scope?: string;

    @property({
      type: 'number',
      postgresql: { columnName: 'parent_id' },
    })
    parentId: number;

    @property({
      type: 'object',
      postgresql: {
        columnName: 'details',
        dataType: 'jsonb',
      },
    })
    details: T;

    constructor(data?: Partial<Permission>) {
      super(data);
    }
  }

  return Permission;
};

// -----------------------------------------------------------------------
export const definePermissionMapping = () => {
  class PermissionMapping extends BaseNumberTzEntity {
    @property({
      type: 'number',
      postgresql: { columnName: 'user_id' },
    })
    userId?: number;

    @property({
      type: 'number',
      postgresql: { columnName: 'role_id' },
    })
    roleId: number;

    @property({
      type: 'number',
      postgresql: { columnName: 'permission_id' },
    })
    permissionId: number;

    @property({ type: 'string' })
    effect: string;

    constructor(data?: Partial<PermissionMapping>) {
      super(data);
    }
  }
  return PermissionMapping;
};

// -----------------------------------------------------------------------
export const defineUserRole = () => {
  class UserRole extends PrincipalMixin(BaseNumberTzEntity, 'Role', 'number') {
    @property({
      type: 'number',
      postgresql: { columnName: 'user_id' },
    })
    userId: number;

    constructor(data?: Partial<UserRole>) {
      super(data);
    }
  }
  return UserRole;
};
