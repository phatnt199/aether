import { IdType } from '@/common/types';
import { BaseEntity } from './base';

// ----------------------------------------------------------------------------------------------------------------------------------------
// Entity Interfaces
// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IEntity {
  id: IdType;
}

export type EntityClassType<T extends BaseEntity> = typeof BaseEntity & {
  prototype: T & { id?: IdType };
};

export type EntityRelationType = Record<string, any>;
