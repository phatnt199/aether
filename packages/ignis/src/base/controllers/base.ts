import { ValueOrPromise } from '@/common/types';
import { createRoute, OpenAPIHono, RouteConfig } from '@hono/zod-openapi';
import { Context } from 'hono';
import { BaseHelper } from '../helpers';
import { IController, IControllerOptions } from './types';

export abstract class BaseController extends BaseHelper implements IController {
  protected tags: string[];
  protected router: OpenAPIHono;

  constructor(opts: IControllerOptions) {
    super(opts);
    const { isStrict = true } = opts;
    this.router = new OpenAPIHono({ strict: isStrict });
  }

  abstract binding(): ValueOrPromise<void>;

  // ------------------------------------------------------------------------------
  getRouter() {
    return this.router;
  }

  async configure(): Promise<OpenAPIHono> {
    const t = performance.now();
    this.logger.info('[binding] START | Binding controller');

    await this.binding();

    this.logger.info('[binding] DONE | Binding controller | Took: %s (ms)', performance.now() - t);
    return this.router;
  }

  // ------------------------------------------------------------------------------
  protected defineRoute<R extends RouteConfig>(opts: {
    configs: R;
    handler: (c: Context) => ValueOrPromise<any>;
    hook?: (result: any, c: Context) => ValueOrPromise<any>;
  }): OpenAPIHono {
    const { configs, handler, hook } = opts;

    return this.router.openapi(
      createRoute({ ...configs, tags: [...(configs?.tags ?? []), this._scope] }),
      handler,
      hook,
    );
  }
}
