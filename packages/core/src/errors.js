// @flow
import { utils, type b64string } from '@tanker/crypto';
import { TankerError } from '@tanker/errors';

// Re-expose these common error classes:
export { TankerError, InvalidArgument } from '@tanker/errors';
export { InvalidIdentity } from '@tanker/identity';

export class DecryptionFailed extends TankerError {
  b64ResourceId: ?b64string;
  next: ?Error;

  constructor(args: { error?: Error, message?: string, resourceId?: Uint8Array }) {
    const { error, resourceId } = args;
    let message = args.message;
    let b64ResourceId;

    if (resourceId) {
      b64ResourceId = utils.toBase64(resourceId);

      if (!message) {
        message = `resource ${b64ResourceId} decryption failed`;
        if (error) message += `with: ${error.toString()}`;
      }
    }

    super('DecryptionFailed', message);

    this.next = error;
    this.b64ResourceId = b64ResourceId;
  }
}

export class ExpiredVerification extends TankerError {
  constructor(message: string) {
    super('ExpiredVerification', message);
  }
}

export class GroupTooBig extends TankerError {
  constructor(message: string) {
    super('GroupTooBig', message);
  }
}

export class InvalidVerification extends TankerError {
  constructor(message: string) {
    super('InvalidVerification', message);
  }
}

export class OperationCanceled extends TankerError {
  constructor(message: string = 'Operation canceled') {
    super('OperationCanceled', message);
  }
}

export class PreconditionFailed extends TankerError {
  constructor(message: string) {
    super('PreconditionFailed', message);
  }
}

export class ServerError extends TankerError {
  error: Object;
  b64TrustchainId: b64string;

  constructor(error: Object, trustchainId: Uint8Array) {
    const b64TrustchainId = utils.toBase64(trustchainId);
    const message = `status: ${error.status}, code: ${error.code}, message: ${error.message}, trustchainId: ${b64TrustchainId}`;
    super('ServerError', message);
    this.error = error;
    this.b64TrustchainId = b64TrustchainId;
  }
}

export class TooManyAttempts extends TankerError {
  constructor(message: string) {
    super('TooManyAttempts', message);
  }
}
