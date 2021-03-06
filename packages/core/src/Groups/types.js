// @flow

import { tcrypto } from '@tanker/crypto';

type GroupBase = {|
  groupId: Uint8Array,
  lastPublicSignatureKey: Uint8Array,
  lastPublicEncryptionKey: Uint8Array,
  lastGroupBlock: Uint8Array,
  lastKeyRotationBlock: Uint8Array,
|};

export type ExternalGroup = {|
  ...GroupBase,
  encryptedPrivateSignatureKey: Uint8Array,
|};

export type InternalGroup = {|
  ...GroupBase,
  signatureKeyPairs: Array<tcrypto.SodiumKeyPair>,
  encryptionKeyPairs: Array<tcrypto.SodiumKeyPair>,
|};

export type Group = InternalGroup | ExternalGroup;

export function isInternalGroup(group: Group): bool %checks {
  return !!group.encryptionKeyPairs && group.encryptionKeyPairs.length !== 0;
}
