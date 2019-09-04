// @flow
import { Transform } from 'readable-stream';

import Uint8Buffer from './Uint8Buffer';

export default class ResizerStream extends Transform {
  _buffer: Uint8Buffer;
  _outputSize: number;

  constructor(outputSize: number) {
    super({
      // buffering input bytes until outputSize is reached
      writableHighWaterMark: outputSize,
      writableObjectMode: false,
      // buffering a single output chunk
      readableHighWaterMark: 1,
      readableObjectMode: true
    });

    this._buffer = new Uint8Buffer();
    this._outputSize = outputSize;
  }

  _pushChunks() {
    while (this._buffer.byteSize() >= this._outputSize) {
      const result = this._buffer.consume(this._outputSize);
      this.push(result);
    }
  }

  async _pushLastChunk() {
    if (this._buffer.byteSize()) {
      const result = this._buffer.consume(this._buffer.byteSize());
      this.push(result);
    }
  }

  _transform(chunk: Uint8Array, encoding: ?string, callback: Function) {
    this._buffer.push(chunk);
    this._pushChunks();
    callback();
  }

  async _flush(callback: Function) {
    this._pushChunks();

    try {
      await this._pushLastChunk();
    } catch (error) {
      callback(error);
      return;
    }

    callback();
  }
}
