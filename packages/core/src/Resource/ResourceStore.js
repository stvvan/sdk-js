// @flow

import { aead, utils, type Key } from '@tanker/crypto';
import { errors as dbErrors, type DataStore } from '@tanker/datastore-base';

const TABLE = 'resource_keys';

export type SharedKeyRecord = {
  resourceId: Uint8Array,
  symmetricKey: Uint8Array,
}

export default class ResourceStore {
  _ds: DataStore<*>;
  _userSecret: Uint8Array;

  static schemas = [
    { version: 1, tables: [{ name: TABLE }] },
    { version: 2, tables: [{ name: TABLE }] },
    { version: 3, tables: [{ name: TABLE }] },
    { version: 4, tables: [{ name: TABLE }] },
    // {
    //   version: 4,
    //   tables: [{
    //     name: TABLE,
    //     indexes: [['new_index'], ...]
    //   }]
    // }
  ];

  constructor(ds: DataStore<*>, userSecret: Uint8Array) {
    if (!userSecret)
      throw new Error('Invalid user secret');

    // _ properties won't be enumerable, nor reconfigurable
    Object.defineProperty(this, '_ds', { value: ds, writable: true });
    Object.defineProperty(this, '_userSecret', { value: userSecret }); // + not writable
  }

  async getAllDecrypted(): Promise<Array<SharedKeyRecord>> {
    const records = await this._ds.getAll(TABLE);

    return Promise.all(records.map(async record => {
      const resourceId = utils.fromBase64(record._id); // eslint-disable-line no-underscore-dangle
      const encryptedKey = utils.fromBase64(record.b64EncryptedKey);
      const symmetricKey = await aead.decryptAEADv1(this._userSecret, encryptedKey, resourceId);
      return { resourceId, symmetricKey };
    }));
  }

  async saveResourceKey(resourceId: Uint8Array, key: Key): Promise<void> {
    // prevent db corruption by using the resourceId as additional data
    const encryptedKey = await aead.encryptAEADv1(this._userSecret, key, resourceId);
    const b64ResourceId = utils.toBase64(resourceId);
    // We never want to overwrite a key for a given resourceId
    try {
      await this._ds.get(TABLE, b64ResourceId);
      // if the key is already there, just ignore the new one
      return;
    } catch (e) {
      if (!(e instanceof dbErrors.RecordNotFound)) {
        throw e;
      }
    }
    await this._ds.put(TABLE, { _id: b64ResourceId, b64EncryptedKey: utils.toBase64(encryptedKey) });
  }

  async findResourceKey(resourceId: Uint8Array): Promise<Key | typeof undefined> {
    try {
      const b64ResourceId = utils.toBase64(resourceId);
      const result = await this._ds.get(TABLE, b64ResourceId);
      const encryptedKey = utils.fromBase64(result.b64EncryptedKey);
      return await aead.decryptAEADv1(this._userSecret, encryptedKey, resourceId);
    } catch (e) {
      if (e instanceof dbErrors.RecordNotFound) {
        return;
      }
      throw e;
    }
  }

  async close(): Promise<void> {
    // Erase traces of critical data first
    utils.memzero(this._userSecret);

    // $FlowIKnow
    this._ds = null;
  }

  static async open(ds: DataStore<*>, userSecret: Uint8Array): Promise<any> {
    return new ResourceStore(ds, userSecret);
  }
}