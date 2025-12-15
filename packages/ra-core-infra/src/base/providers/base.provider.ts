import { Container, IProvider } from '@venizia/ignis-inversion';

import { BaseHelper } from '@/helpers/base.helper';

export abstract class BaseProvider<T> extends BaseHelper implements IProvider<T> {
  abstract value(container: Container): T;
}
