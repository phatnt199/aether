import { TCrashReportProviders } from './types';

export class CrashReportKeys {
  static readonly REPORT_PROVIDERS = '@app/crash-report/report-providers';

  static readonly THIRD_PARTY_PROVIDER = '@app/crash-report/third-party-provider';
}

export class CrashReportProviderKeys {
  static readonly MT_PROVIDER: TCrashReportProviders = '@app/crash-report/mt-provider';
  static readonly SENTRY_PROVIDER: TCrashReportProviders = '@app/crash-report/sentry-provider';

  static readonly SCHEME_SET = new Set<TCrashReportProviders>([
    this.MT_PROVIDER,
    this.SENTRY_PROVIDER,
  ]);

  static isValid(opts: { identifier: string }) {
    return this.SCHEME_SET.has(opts.identifier as TCrashReportProviders);
  }
}
