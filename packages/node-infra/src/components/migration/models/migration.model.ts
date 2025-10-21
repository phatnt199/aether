import { BaseNumberTzEntity } from '@/base/models';
import { MigrationStatuses } from '@/common';
import { model, property } from '@loopback/repository';

@model({
  settings: {
    postgresql: {
      schema: 'public',
      table: 'Migration',
    },
    strict: true,
    indexes: {
      INDEX_UNIQUE_NAME: {
        keys: { name: 1 },
        options: { unique: true },
      },
    },
  },
})
export class Migration extends BaseNumberTzEntity {
  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'string',
    default: MigrationStatuses.UNKNOWN,
  })
  status: string;

  constructor(data?: Partial<Migration>) {
    super(data);
  }
}
