import { IControllerOptions } from '@/base/controllers';
import { BaseController } from '@/base/controllers/base.controller';
import { ValueOrPromise } from '@/common';
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
      method: 'get',
      path: '/',
      responses: {
        200: {
          description: 'Health check status',
          content: {
            'application/json': {
              schema: z.object({
                status: z.string(),
              }),
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
