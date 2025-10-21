import { BaseNumberTzEntity } from '@/base';
import { model, property } from '@loopback/repository';

@model({
  settings: {
    postgresql: {
      schema: 'open_auth',
      table: 'OAuth2Scope',
    },
    hiddenProperties: ['createdAt', 'modifiedAt'],
  },
})
export class OAuth2Scope extends BaseNumberTzEntity {
  @property({
    type: 'string',
    postgresql: { columnName: 'identifier' },
  })
  identifier: string;

  @property({
    type: 'string',
    postgresql: { columnName: 'name' },
  })
  name: string;

  @property({
    type: 'string',
    postgresql: { columnName: 'description' },
  })
  description: string;

  @property({
    type: 'string',
    postgresql: { columnName: 'protocol' },
  })
  protocol: string;

  constructor(data?: Partial<OAuth2Scope>) {
    super(data);
  }
}
