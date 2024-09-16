import { BaseNetworkRequest, RSA } from '@/helpers';
import { BaseCrashReportProvider } from '../providers';
import { ISendReport, MTEndpoints } from '../common';
import isEmpty from 'lodash/isEmpty';

class CrashReportNetworkRequest extends BaseNetworkRequest {}

export class MTCrashReportService extends BaseCrashReportProvider {
  private crashReportNetworkRequest: CrashReportNetworkRequest;
  private rsa = RSA.withAlgorithm();

  constructor() {
    super({ scope: MTCrashReportService.name });
    this.crashReportNetworkRequest = new CrashReportNetworkRequest({
      name: CrashReportNetworkRequest.name,
      scope: MTCrashReportService.name,
      networkOptions: {
        baseURL: MTEndpoints.BASE_URL,
      },
    });
  }

  sendReport(opts: ISendReport) {
    const {
      options: { projectId, eventName, publicKey, environment = process.env.NODE_ENV, generateBodyFn },
      error,
    } = opts;

    if (!publicKey || isEmpty(publicKey)) {
      this.logger.error('[sendReport] Invalid public key to send crash report!');
      return;
    }

    const body = generateBodyFn?.() ?? {
      appVersion: process.env.npm_package_version,
      appType: eventName,
      eventType: error.name,
      trace: error,
      projectId,
      environment,
    };

    const stringified = JSON.stringify({ projectId, environment });

    Promise.resolve(this.rsa.encrypt(stringified, publicKey))
      .then(signature => {
        this.crashReportNetworkRequest
          .getNetworkService()
          .send({
            url: this.crashReportNetworkRequest.getRequestUrl({
              paths: [MTEndpoints.EVENTS],
            }),
            method: 'post',
            body: { ...body, signature },
          })
          .then(() => {
            this.logger.info(
              '[sendReport] Provider: %s | Successfully sent crash report to endpoint',
              'MT_CRASH_REPORT',
            );
          })
          .catch(err => {
            this.logger.error(
              '[sendReport] Provider: %s | Failed to send crash report to endpoint | Error: %s',
              'MT_CRASH_REPORT',
              err,
            );
          });
      })
      .catch(err => {
        this.logger.error(
          '[sendReport] Provider: %s | Failed to encrypt crash report | Error: %s',
          'MT_CRASH_REPORT',
          err,
        );
      });
  }
}
