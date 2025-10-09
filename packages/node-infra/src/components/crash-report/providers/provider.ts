import { BaseApplication } from '@/base/applications';
import { getError } from '@/utilities';
import { CoreBindings, inject, Provider, ValueOrPromise } from '@loopback/core';
import { CrashReportProviderKeys, ICrashReportProvider, TCrashReportProviders } from '../common';
import { MTCrashReportService } from '../services';

export type TGetCrashReportProviderFn = (opts: {
  identifier: TCrashReportProviders;
}) => ICrashReportProvider | null;

export class CrashReportProvider implements Provider<TGetCrashReportProviderFn> {
  constructor(@inject(CoreBindings.APPLICATION_INSTANCE) private application: BaseApplication) {}

  value(): ValueOrPromise<TGetCrashReportProviderFn> {
    return (opts: { identifier: TCrashReportProviders }) => {
      switch (opts.identifier) {
        case CrashReportProviderKeys.MT_PROVIDER: {
          const service = this.application.getSync<MTCrashReportService>(
            'services.MTCrashReportService',
          );
          return service;
        }
        case CrashReportProviderKeys.SENTRY_PROVIDER: {
          throw getError({ message: '[CrashReportProvider] SENTRY Provider is not supported' });
        }
        default: {
          throw getError({
            message: `[CrashReportProvider] Invaid third party identifier | identifier: ${opts.identifier}`,
          });
        }
      }
    };
  }
}
