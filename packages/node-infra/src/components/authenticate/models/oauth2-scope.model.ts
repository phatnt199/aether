import { BaseNumberTzEntity } from '@/base/models';
import { model, property } from '@loopback/repository';
import { IScopeRelationDefinition } from '../common';

@model({
  settings: {
    postgresql: {
      schema: 'open_auth',
      table: 'OAuth2Scope',
    },
    hiddenProperties: ['createdAt', 'modifiedAt'],
    indexes: {
      INDEX_OAUTH2_SCOPE_IDENTIFIER: {
        keys: {
          identifier: 1,
        },
        options: {
          unique: true,
        },
      },
      INDEX_OAUTH2_SCOPE_IS_ACTIVE: {
        keys: {
          isActive: 1,
        },
      },
    },
  },
})
export class OAuth2Scope extends BaseNumberTzEntity {
  @property({
    type: 'string',
    required: true,
    postgresql: { columnName: 'identifier' },
  })
  identifier: string;

  @property({
    type: 'string',
    required: true,
    postgresql: { columnName: 'name' },
  })
  name: string;

  @property({
    type: 'string',
    postgresql: { columnName: 'description' },
  })
  description?: string;

  @property({
    type: 'string',
    postgresql: { columnName: 'protocol' },
  })
  protocol?: string;

  @property({
    type: 'array',
    itemType: 'string',
    postgresql: {
      columnName: 'fields',
      dataType: 'jsonb',
    },
  })
  fields?: string[];

  @property({
    type: 'array',
    itemType: 'object',
    postgresql: {
      columnName: 'relations',
      dataType: 'jsonb',
    },
  })
  relations?: IScopeRelationDefinition[];

  @property({
    type: 'boolean',
    default: true,
    postgresql: { columnName: 'is_active' },
  })
  isActive?: boolean;

  constructor(data?: Partial<OAuth2Scope>) {
    super(data);
  }
}
