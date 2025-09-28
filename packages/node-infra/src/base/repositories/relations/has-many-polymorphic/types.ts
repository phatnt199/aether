import { HasManyDefinition } from '@loopback/repository';

export type TPolymorphic = { discriminator: string | { typeField: string; idField: string } };

export interface IHasManyPolymorphicDefinition extends Omit<HasManyDefinition, 'through'> {
  polymorphic: TPolymorphic;
}
