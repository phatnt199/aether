import { model } from '@loopback/repository';
import { definePermission } from './defs';

const BasePermission = definePermission();

@model({
  settings: {
    postgresql: {
      schema: 'public',
      table: 'Permission',
    },
    hiddenProperties: ['createdAt', 'modifiedAt'],
  },
})
export class Permission extends BasePermission {
  constructor(data?: Partial<Permission>) {
    super(data);
  }
}
