import { CASignTypes, IAutoUpdaterOptions } from '@/common';
import { AnyType, dayjs } from '@minimaltech/node-infra';

export const verifySelfCodeSigningSignature = async (opts: {
  publishers: Array<string>;
  tmpPath: string;
  signature: AnyType;
  autoUpdaterOptions: { use: false } | IAutoUpdaterOptions<AnyType>;
}) => {
  const { autoUpdaterOptions } = opts;
  if (!autoUpdaterOptions?.use) {
    return null;
  }

  const { caType } = autoUpdaterOptions.verify;
  if (caType !== CASignTypes.SELF_SIGNED_CA) {
    return `Not allow custom verifySignature for non self-signed verification | caType: ${caType}`;
  }

  // Validate OS SignTool Result
  const { doVerifySignToolStatus = true, validSubjects = null } =
    autoUpdaterOptions.verify;
  const { signature } = opts;

  if (doVerifySignToolStatus && signature.Status !== 0) {
    return `Invalid signature status | status: ${signature.Status} - ${signature.StatusMessage}`;
  }

  // Validate Certificate Issuer
  const subject = signature?.SignerCertificate?.Subject || '';
  if (validSubjects?.length) {
    const validCNs = validSubjects.map(cn => `CN=${cn}`);

    const isValidCN = validCNs.findIndex(cn => subject.includes(cn)) > -1;

    if (!isValidCN) {
      return `Invalid certificate subject | expected: ${validCNs} | subject: ${subject}`;
    }
  }

  // Validate Certificate Period
  const certNotBefore = signature?.SignerCertificate?.NotBefore;
  const certNotAfter = signature?.SignerCertificate?.NotAfter;

  if (!certNotBefore || !certNotAfter) {
    return 'Missing certificate validity period (NotBefore or NotAfter)';
  }

  const notBefore = parseInt(certNotBefore.replace(/[^0-9]/g, ''), 10);
  const notAfter = parseInt(certNotAfter.replace(/[^0-9]/g, ''), 10);
  const now = new Date().getTime();

  if (now < notBefore) {
    return `Certificate is not valid yet. Valid from: ${dayjs(notBefore).toISOString()}`;
  }

  if (now > notAfter) {
    return `Certificate has expired. Valid until: ${dayjs(notAfter).toISOString()}`;
  }

  return null;
};
