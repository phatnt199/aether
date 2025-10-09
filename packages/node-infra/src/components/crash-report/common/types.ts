import { AnyObject, IdType, ValueOrPromise } from '@/common';

// ----------------------------------------------------------------------------------------------------------------------------------------
export interface ICreateEventRequest {
  appVersion?: string;
  appType?: string;
  eventType?: string;

  device?: Record<string | symbol, string | number>;

  sdk?: {
    platform?: string;
    version?: string;
  };

  actions?: Array<AnyObject>;

  trace?: Record<string | symbol, string | number>; // eventTrace

  // For further
  [extra: string | symbol]: any;
}

// ----------------------------------------------------------------------------------------------------------------------------------------
export type TCrashReportProviders =
  | '@app/crash-report/mt-provider'
  | '@app/crash-report/sentry-provider';

// ----------------------------------------------------------------------------------------------------------------------------------------
export interface ICrashReportOptions {
  projectId?: IdType;
  eventName: string;
  publicKey?: string;
  environment?: string;
  generateBodyFn?: () => AnyObject;
}

// ----------------------------------------------------------------------------------------------------------------------------------------
export interface ISendReport {
  options: ICrashReportOptions;
  error: Error;
}

// ----------------------------------------------------------------------------------------------------------------------------------------
export interface ICrashReportProvider {
  sendReport: (opts: ISendReport) => ValueOrPromise<void>;
}
