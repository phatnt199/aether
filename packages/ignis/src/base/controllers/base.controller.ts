import { ValueOrPromise } from '@/common/types';
import { createRoute, OpenAPIHono, type RouteConfig, type RouteHandler } from '@hono/zod-openapi';
import type { Context, Env, ValidationTargets } from 'hono';
import { BaseHelper } from '../base.helper';
import { IController, IControllerOptions } from './types';

type THook<T, E extends Env, P extends string, R> = (
  result: { target: keyof ValidationTargets } & (
    | { success: true; data: T }
    | { success: false; error: any }
  ),
  c: Context<E, P>,
) => R;

export abstract class BaseController extends BaseHelper implements IController {
  protected route: OpenAPIHono;

  constructor(opts: IControllerOptions) {
    super(opts);
    const { isStrict = true, basePath = '' } = opts;
    this.route = new OpenAPIHono({ strict: isStrict }).basePath(basePath);
  }

  abstract binding(): ValueOrPromise<void>;

  protected defineRoute<R extends RouteConfig>(
    opts: R & {
      handler: RouteHandler<R>;
      hook?: THook<unknown, Env, string, Response | void | Promise<Response | void>>;
    },
  ) {
    const { handler, hook, ...rest } = opts;

    return this.route.openapi(
      createRoute({
        ...rest,
        tags: [...(rest?.tags ?? []), this._scope],
      } as R),
      handler,
      hook,
    );
  }
}
