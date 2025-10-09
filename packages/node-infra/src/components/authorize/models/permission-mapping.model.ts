import { model } from '@loopback/repository';
import { definePermissionMapping } from './defs';

const BasePermissionMapping = definePermissionMapping();

@model({
  settings: {
    postgresql: {
      schema: 'public',
      table: 'PermissionMapping',
    },
    hiddenProperties: ['createdAt', 'modifiedAt'],
    indexes: {
      INDEX_UNIQUE_USER_ROLE_PERMISSION: {
        keys: { userId: 1, roleId: 1, permissionId: 1 },
        options: { unique: true },
      },
    },
  },
})
export class PermissionMapping extends BasePermissionMapping {
  constructor(data?: Partial<PermissionMapping>) {
    super(data);
  }
}
