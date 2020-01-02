// @flow
import { tcrypto, utils, encryptionV1, type b64string } from '@tanker/crypto';
import { DecryptionFailed, InternalError } from '@tanker/errors';

import { type Device } from '../../Users/types';

export type ProvisionalUserKeyPairs = {|
  id: string,
  appEncryptionKeyPair: tcrypto.SodiumKeyPair,
  tankerEncryptionKeyPair: tcrypto.SodiumKeyPair,
|};

export type LocalUserKeys = { currentUserKey: tcrypto.SodiumKeyPair, userKeys: { [string]: tcrypto.SodiumKeyPair }};

export type IndexedProvisionalUserKeyPairs = { [id: string]: ProvisionalUserKeyPairs };

export type KeySafe = {|
  signaturePair: tcrypto.SodiumKeyPair,
  encryptionPair: tcrypto.SodiumKeyPair,
  provisionalUserKeys: IndexedProvisionalUserKeyPairs,
  devices: Array<Device>,
  deviceId: ?b64string,
  trustchainPublicKey: ?b64string,
  localUserKeys: ?LocalUserKeys,
|};

function startsWith(haystack: string, needle: string) {
  if (String.prototype.startsWith)
    return haystack.startsWith(needle);

  return haystack.substr(0, needle.length) === needle;
}

const base64Prefix = '__BASE64__';

async function encryptObject(key: Uint8Array, plainObject: Object): Promise<Uint8Array> {
  const json = JSON.stringify(plainObject, (_k, v) => {
    if (v instanceof Uint8Array) {
      return base64Prefix + utils.toBase64(v);
    }
    return v;
  });
  return encryptionV1.serialize(encryptionV1.encrypt(key, utils.fromString(json)));
}

async function decryptObject(key: Uint8Array, ciphertext: Uint8Array): Promise<Object> {
  if (ciphertext.length < encryptionV1.overhead) {
    throw new DecryptionFailed({ message: `truncated encrypted data. Length should be at least ${encryptionV1.overhead} for encryption v1` });
  }
  const jsonBytes = encryptionV1.compatDecrypt(key, ciphertext);
  return JSON.parse(utils.toString(jsonBytes), (_k, v) => {
    if (typeof v === 'string' && startsWith(v, base64Prefix))
      return utils.fromBase64(v.substring(base64Prefix.length));
    return v;
  });
}

export function generateKeySafe(): KeySafe {
  return {
    deviceId: null,
    signaturePair: tcrypto.makeSignKeyPair(),
    encryptionPair: tcrypto.makeEncryptionKeyPair(),
    provisionalUserKeys: {},
    devices: [],
    trustchainPublicKey: null,
    localUserKeys: null,
  };
}

export async function serializeKeySafe(keySafe: KeySafe, userSecret: Uint8Array): Promise<b64string> {
  const encrypted = await encryptObject(userSecret, keySafe);
  return utils.toBase64(encrypted);
}

export async function deserializeKeySafe(serializedSafe: b64string, userSecret: Uint8Array): Promise<KeySafe> {
  const encryptedSafe = utils.fromBase64(serializedSafe);
  const safe = await decryptObject(userSecret, encryptedSafe);

  // Validation
  if (!safe || typeof safe !== 'object') {
    throw new InternalError('Invalid key safe');
  }

  // Migrations
  if (safe.provisionalUserKeys instanceof Array) {
    // Format migration for device created with SDKs in the v2.0.0-alpha series:
    for (const puk of safe.provisionalUserKeys) {
      safe.provisionalUserKeys[puk.id] = puk;
    }
  } else if (!safe.provisionalUserKeys) {
    // Add an empty default for devices created before SDK v2.0.0
    safe.provisionalUserKeys = {};
  }

  // Validation of keys
  if (!safe.signaturePair || !safe.encryptionPair) {
    throw new InternalError('Invalid key safe');
  }

  return safe;
}
