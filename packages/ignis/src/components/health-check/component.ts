import { BaseApplication } from '@/base/applications';
import { BaseComponent } from '@/base/components';
import { CoreBindings } from '@/common/bindings';
import { ValueOrPromise } from '@/common/types';
import { Binding } from '@/helpers/inversion';
import { inject } from '@/helpers/inversion/decorators';
import { OpenAPIHono } from '@hono/zod-openapi';
import { HealthCheckBindingKeys } from './keys';
import { IHealthCheckOptions } from './types';
import { HealthCheckController } from './controller';

export class HealthCheckComponent extends BaseComponent {
  protected route: OpenAPIHono;

  constructor(
    @inject({ key: CoreBindings.APPLICATION_INSTANCE }) private application: BaseApplication,
  ) {
    super({ scope: HealthCheckComponent.name });

    this.bindings = {
      [HealthCheckBindingKeys.HEALTH_CHECK_OPTIONS]: Binding.bind<IHealthCheckOptions>({
        key: HealthCheckBindingKeys.HEALTH_CHECK_OPTIONS,
      }).toValue({ restOptions: { path: '/health' } }),
    };

    this.route = new OpenAPIHono({ strict: true });
  }

  override binding(): ValueOrPromise<void> {
    const healthOptions = this.application.get<IHealthCheckOptions>({
      key: HealthCheckBindingKeys.HEALTH_CHECK_OPTIONS,
      optional: true,
    }) ?? {
      restOptions: { path: '/health' },
    };

    /* this.route.openapi(
      createRoute({
        path: '/',
        method: 'get',
        responses: {
          200: {
            description: 'Server is alive | Status: OK',
            content: {
              'application/json': {
                schema: z.object({ status: z.string() }),
              },
            },
          },
        },
      }),

      context => {
        return context.json({ status: 'ok' }, 200);
      },
    ); */

    this.application.controller(HealthCheckController);

    const applicationRoute = this.application.getServer();
    applicationRoute.route(healthOptions.restOptions.path, this.route);
  }
}
