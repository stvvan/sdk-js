// @flow
import { InvalidArgument } from '@tanker/errors';
import { assertNotEmptyString } from '@tanker/types';

export type EmailVerificationMethod = $Exact<{ type: 'email', email: string }>;
export type PassphraseVerificationMethod = $Exact<{ type: 'passphrase' }>;
export type KeyVerificationMethod = $Exact<{ type: 'verificationKey' }>;
export type OIDCVerificationMethod = $Exact<{ type: 'oidcIdToken' }>;

export type VerificationMethod = EmailVerificationMethod | PassphraseVerificationMethod | KeyVerificationMethod | OIDCVerificationMethod;

export type EmailVerification = $Exact<{ email: string, verificationCode: string }>;
export type PassphraseVerification = $Exact<{ passphrase: string }>;
export type KeyVerification = $Exact<{ verificationKey: string }>;
export type OIDCVerification = $Exact<{ oidcIdToken: string }>;

export type Verification = EmailVerification | PassphraseVerification | KeyVerification | OIDCVerification;
export type RemoteVerification = EmailVerification | PassphraseVerification | OIDCVerification;

export type WithTokenOptions = {| withToken?: {| nonce: string |} |};
export type VerificationWithToken = {| ...Verification, ...WithTokenOptions |};
export type RemoteVerificationWithToken = {| ...RemoteVerification, ...WithTokenOptions |};

export type VerificationOptions = $Exact<{ withSessionToken?: bool }>;

const validMethods = ['email', 'passphrase', 'verificationKey', 'oidcIdToken'];
const validKeys = [...validMethods, 'verificationCode'];

const validVerifOptionsKeys = ['withSessionToken'];

export const assertVerification = (verification: Verification) => {
  if (!verification || typeof verification !== 'object' || verification instanceof Array)
    throw new InvalidArgument('verification', 'object', verification);

  if (Object.keys(verification).some(k => !validKeys.includes(k)))
    throw new InvalidArgument('verification', `should only contain keys in ${JSON.stringify(validKeys)}`, verification);

  const methodCound = validMethods.reduce((count, key) => count + (key in verification ? 1 : 0), 0);

  if (methodCound !== 1)
    throw new InvalidArgument('verification', `should contain a single verification method in ${JSON.stringify(validMethods)}`, verification);

  if ('email' in verification) {
    // $FlowIgnore[prop-missing]
    assertNotEmptyString(verification.email, 'verification.email');
    if (!('verificationCode' in verification)) {
      throw new InvalidArgument('verification', 'email verification should also have a verificationCode', verification);
    }
    // $FlowIgnore[prop-missing]
    assertNotEmptyString(verification.verificationCode, 'verification.verificationCode');
  } else if ('passphrase' in verification) {
    // $FlowIgnore[prop-missing]
    assertNotEmptyString(verification.passphrase, 'verification.passphrase');
  } else if ('verificationKey' in verification) {
    // $FlowIgnore[prop-missing]
    assertNotEmptyString(verification.verificationKey, 'verification.verificationKey');
  } else if ('oidcIdToken' in verification) {
    // $FlowIgnore[prop-missing]
    assertNotEmptyString(verification.oidcIdToken, 'verification.oidcIdToken');
  }
};

export const assertVerificationOptions = (options: ?VerificationOptions) => {
  if (!options)
    return;

  if (typeof options !== 'object' || options instanceof Array) {
    throw new InvalidArgument('options', 'object', options);
  }

  if (Object.keys(options).some(k => !validVerifOptionsKeys.includes(k)))
    throw new InvalidArgument('options', `should only contain keys in ${JSON.stringify(validVerifOptionsKeys)}`, options);

  if ('withSessionToken' in options && typeof options.withSessionToken !== 'boolean')
    throw new InvalidArgument('options', 'withSessionToken must be a boolean', options);
};
