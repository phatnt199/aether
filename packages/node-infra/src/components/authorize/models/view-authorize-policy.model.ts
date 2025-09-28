import { BaseEntity } from '@/base/models';
import { IdType, StringIdType } from '@/common';
import { model, property } from '@loopback/repository';

// ---------------------------------------------------------------
@model({
  settings: {
    postgresql: {
      schema: 'public',
      table: 'ViewAuthorizePolicy',
    },
    indexes: {
      INDEX_UNIQUE_SUBJECT: {
        keys: { subject: 1 },
        options: { unique: true },
      },
    },
  },
})
export class ViewAuthorizePolicy extends BaseEntity {
  @property({ type: 'string', id: true })
  id: StringIdType;

  @property({
    type: 'string',
    postgresql: {
      columnName: 'subject',
    },
  })
  subject: string;

  @property({
    type: 'string',
    postgresql: {
      columnName: 'subject_type',
    },
  })
  subjectType: string;

  @property({
    type: 'string',
    postgresql: {
      columnName: 'subject_id',
    },
  })
  subjectId: IdType;

  constructor(data?: Partial<ViewAuthorizePolicy>) {
    super(data);
  }
}
