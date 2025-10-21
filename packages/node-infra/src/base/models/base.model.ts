import {
  DataTypeMixin,
  DuplicatableMixin,
  ObjectSearchMixin,
  SoftDeleteModelMixin,
  TextSearchMixin,
  TzMixin,
  UserAuditMixin,
  VectorMixin,
} from '@/mixins';
import { Entity, property } from '@loopback/repository';

// ---------------------------------------------------------------------
export class BaseEntity extends Entity {}

// ---------------------------------------------------------------------
export class BaseKVEntity<T = any> extends BaseEntity {
  @property({ type: 'object' })
  payload: T;
}

// ---------------------------------------------------------------------
export class BaseNumberIdEntity extends BaseEntity {
  @property({ type: 'number', id: true, generated: true })
  id: number;
}
export class BaseStringIdEntity extends BaseEntity {
  @property({ type: 'string', id: true })
  id: string;
}
export class BaseIdEntity extends BaseNumberIdEntity {}
export type TBaseIdEntity = BaseNumberIdEntity | BaseStringIdEntity;

// ---------------------------------------------------------------------
export class BaseNumberTzEntity extends TzMixin(BaseNumberIdEntity) {}
export class BaseStringTzEntity extends TzMixin(BaseStringIdEntity) {}
export class BaseTzEntity extends BaseNumberTzEntity {}
export type TBaseTzEntity = BaseNumberTzEntity | BaseStringTzEntity;

// ---------------------------------------------------------------------
/**
 * Basic UserAuditMixed class with createdBy and modifiedBy
 *
 * NOTICE: This method have no userResolver
 *
 * In case you need to include User, directly extends {@link UserAuditMixin}
 */
export class BaseNumberUserAuditTzEntity extends UserAuditMixin(BaseNumberTzEntity) {}
export class BaseStringUserAuditTzEntity extends UserAuditMixin(BaseStringTzEntity) {}
export class BaseUserAuditTzEntity extends BaseNumberUserAuditTzEntity {}
export type TBaseUserAuditTzEntity = BaseNumberUserAuditTzEntity | BaseStringUserAuditTzEntity;

// ---------------------------------------------------------------------
export class BaseNumberDataTypeTzEntity extends DataTypeMixin(BaseNumberTzEntity) {}
export class BaseStringDataTypeTzEntity extends DataTypeMixin(BaseStringTzEntity) {}
export class BaseDataTypeTzEntity extends BaseNumberDataTypeTzEntity {}
export type TBaseDataTypeTzEntity = BaseNumberDataTypeTzEntity | BaseStringDataTypeTzEntity;

// ---------------------------------------------------------------------
export class BaseNumberTextSearchTzEntity extends TextSearchMixin(BaseNumberTzEntity) {}
export class BaseStringTextSearchTzEntity extends TextSearchMixin(BaseStringTzEntity) {}
export class BaseTextSearchTzEntity extends BaseNumberTextSearchTzEntity {}
export type TBaseTextSearchTzEntity = BaseNumberTextSearchTzEntity | BaseStringTextSearchTzEntity;

// ---------------------------------------------------------------------
export class BaseNumberObjectSearchTzEntity extends ObjectSearchMixin(BaseNumberTzEntity) {}
export class BaseStringObjectSearchTzEntity extends ObjectSearchMixin(BaseStringTzEntity) {}
export class BaseObjectSearchTzEntity extends BaseNumberObjectSearchTzEntity {}
export type TBaseObjectSearchTzEntity =
  | BaseNumberObjectSearchTzEntity
  | BaseStringObjectSearchTzEntity;

// ---------------------------------------------------------------------
export class BaseNumberSearchableTzEntity extends ObjectSearchMixin(
  TextSearchMixin(BaseNumberTzEntity),
) {}
export class BaseStringSearchableTzEntity extends ObjectSearchMixin(
  TextSearchMixin(BaseStringTzEntity),
) {}
export class BaseSearchableTzEntity extends BaseNumberSearchableTzEntity {}
export type TBaseSearchableTzEntity = BaseNumberSearchableTzEntity | BaseStringSearchableTzEntity;

// ---------------------------------------------------------------------
export class BaseNumberSoftDeleteTzEntity extends SoftDeleteModelMixin(BaseNumberTzEntity) {}
export class BaseStringSoftDeleteTzEntity extends SoftDeleteModelMixin(BaseStringTzEntity) {}
export class BaseSoftDeleteTzEntity extends BaseNumberSoftDeleteTzEntity {}
export type TBaseSoftDeleteTzEntity = BaseNumberSoftDeleteTzEntity | BaseStringSoftDeleteTzEntity;

// ---------------------------------------------------------------------
export class BaseNumberDuplicatableTzEntity extends DuplicatableMixin(BaseNumberTzEntity) {}
export class BaseStringDuplicatableTzEntity extends DuplicatableMixin(BaseNumberTzEntity) {}
export class BaseDuplicatableTzEntity extends BaseNumberDuplicatableTzEntity {}
export type TBaseDuplicatableTzEntity =
  | BaseNumberDuplicatableTzEntity
  | BaseStringDuplicatableTzEntity;

// ---------------------------------------------------------------------
export class BaseBigIdEntity extends BaseEntity {
  @property({
    type: 'number',
    id: true,
    postgresql: { columnName: 'id', dataType: 'BIGSERIAL' },
  })
  id: number;
}

// ---------------------------------------------------------------------
export class BaseBigIdTzEntity extends TzMixin(BaseBigIdEntity) {}

// ---------------------------------------------------------------------
export class BaseVectorEntity extends VectorMixin(BaseBigIdTzEntity, {
  uuid: {
    columnName: 'uuid',
  },
  embedding: {
    columnName: 'embedding',
    vectorSize: 768 * 2,
  },
}) {}
