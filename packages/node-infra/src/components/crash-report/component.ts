import { BaseApplication } from '@/base/applications';
import { BaseComponent } from '@/base/base.component';
import { getError } from '@/utilities';
import { CoreBindings, Getter, inject, LifeCycleObserver } from '@loopback/core';
import {
  CrashReportKeys,
  CrashReportProviderKeys,
  ICrashReportOptions,
  ICrashReportProvider,
  TCrashReportProviders,
} from './common';
import { CrashReportProvider, TGetCrashReportProviderFn } from './providers';
import { MTCrashReportService } from './services';

export class CrashReportComponent extends BaseComponent implements LifeCycleObserver {
  constructor(
    @inject(CoreBindings.APPLICATION_INSTANCE) protected application: BaseApplication,
    @inject.getter(CrashReportKeys.THIRD_PARTY_PROVIDER)
    protected crashReportProviderGetter: Getter<TGetCrashReportProviderFn>,
  ) {
    super({ scope: CrashReportComponent.name });
  }

  defineProviders() {
    this.application.bind(CrashReportKeys.THIRD_PARTY_PROVIDER).toProvider(CrashReportProvider);
  }

  defineServices() {
    this.application.service(MTCrashReportService);
  }

  async binding() {
    if (!this.application.isBound(CrashReportKeys.REPORT_PROVIDERS)) {
      throw getError({
        message:
          '[binding] Invalid crash report provider | REPORT_PROVIDER is not bounded to application context',
      });
    }
    const reportProviders =
      this.application.getSync<
        Array<{ identifier: TCrashReportProviders; options: ICrashReportOptions }>
      >(CrashReportKeys.REPORT_PROVIDERS) ?? [];

    const providerServices: Array<{ service: ICrashReportProvider; options: ICrashReportOptions }> =
      [];
    for (const reportProvider of reportProviders) {
      const { identifier, options } = reportProvider;
      if (!CrashReportProviderKeys.isValid({ identifier })) {
        this.logger.error('[binding] Invalid provider identifier: %s | Valid: %j', identifier, [
          ...CrashReportProviderKeys.SCHEME_SET,
        ]);
        continue;
      }

      const service = (await this.crashReportProviderGetter())({ identifier });
      if (!service) {
        this.logger.error('[binding] Identifier: %s | Failed to create report service', identifier);
        continue;
      }

      providerServices.push({ service, options });
    }

    if (!providerServices.length) {
      this.logger.error('[binding] No providerServices to init report!');
      return;
    }

    process.on('uncaughtException', error => {
      Promise.all(
        providerServices.map(({ service, options }) => {
          return service.sendReport({ options, error });
        }),
      );
    });
  }

  start() {
    if (!this.application) {
      throw getError({
        statusCode: 500,
        message: '[start] Invalid application to bind CrashReportComponent',
      });
    }
    this.logger.info('[start] Binding crash report component for application...');

    // Binding providers
    this.defineProviders();

    // Binding services
    this.defineServices();

    // Binding options
    this.binding();
  }
}
