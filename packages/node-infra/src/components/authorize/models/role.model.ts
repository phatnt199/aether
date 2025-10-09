import { hasMany, model } from '@loopback/repository';
import { Permission, PermissionMapping } from '.';
import { defineRole } from './defs';

const BaseRole = defineRole();

// ---------------------------------------------------------------
@model({
  settings: {
    postgresql: {
      schema: 'public',
      table: 'Role',
    },
    hiddenProperties: ['createdAt', 'modifiedAt'],
  },
})
export class Role extends BaseRole {
  @hasMany(() => Permission, {
    through: {
      model: () => PermissionMapping,
      keyFrom: 'roleId',
      keyTo: 'permissionId',
    },
  })
  permissions: Permission[];

  constructor(data?: Partial<Role>) {
    super(data);
  }
}
