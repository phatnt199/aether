import { BaseController, IControllerOptions } from '@/base/controllers';
import { HTTP, ValueOrPromise } from '@/common';
import { z } from '@hono/zod-openapi';

export class HealthCheckController extends BaseController {
  constructor(opts: IControllerOptions) {
    super({
      ...opts,
      scope: HealthCheckController.name,
    });
  }

  override binding(): ValueOrPromise<void> {
    this.defineRoute({
      configs: {
        method: 'get',
        path: '/',
        responses: {
          [HTTP.ResultCodes.RS_2.Ok]: {
            description: 'Health check status',
            content: {
              'application/json': {
                schema: z.object({ status: z.string() }),
              },
            },
          },
        },
      },
      handler: c => {
        return c.json({ status: 'ok' }, 200);
      },
    });
  }
}
