import { BindingKeys, ExposeVerbs, IExposeMetadata } from '@/common';
import {
  DecoratorOptions,
  MethodDecoratorFactory,
} from '@minimaltech/node-infra/lb-core';

export function expose(spec: IExposeMetadata, opts?: DecoratorOptions): MethodDecorator {
  return MethodDecoratorFactory.createDecorator<IExposeMetadata>(
    BindingKeys.EXPOSE_METHOD_KEY,
    spec,
    opts,
  );
}

export function handler(
  spec?: Omit<IExposeMetadata, 'verb'>,
  opts?: DecoratorOptions,
): MethodDecorator {
  return expose({ ...(spec ?? {}), verb: ExposeVerbs.HANDLER }, opts);
}

export function subscriber(
  spec?: Omit<IExposeMetadata, 'verb'>,
  opts?: DecoratorOptions,
): MethodDecorator {
  return expose({ ...(spec ?? {}), verb: ExposeVerbs.SUBSCRIBER }, opts);
}

export function sender(
  spec?: Omit<IExposeMetadata, 'verb'>,
  opts?: DecoratorOptions,
): MethodDecorator {
  return expose({ ...(spec ?? {}), verb: ExposeVerbs.SENDER }, opts);
}
