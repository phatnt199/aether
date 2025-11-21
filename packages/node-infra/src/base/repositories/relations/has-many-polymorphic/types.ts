import { HasManyDefinition } from '@loopback/repository';

export type THasManyPolymorphic = { discriminator: string | { typeField: string; idField: string } };

export interface IHasManyPolymorphicDefinition extends Omit<HasManyDefinition, 'through'> {
  polymorphic: THasManyPolymorphic;
}
