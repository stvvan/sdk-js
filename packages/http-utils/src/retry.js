// @flow
import type { DelayGenerator } from './delay';
import { exponentialDelayGenerator } from './delay';

type RetryOptions = $Exact<{
  retries: number,
  retryCondition?: (error: Error) => Promise<bool> | bool;
  delayGenerator?: DelayGenerator,
}>;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retry<T>(fn: () => Promise<T> | T, opts: RetryOptions): Promise<T> {
  const { retries, retryCondition } = opts;
  const delayGenerator = opts.delayGenerator || exponentialDelayGenerator;

  const delays = delayGenerator(retries);

  const doTry = async () => {
    try {
      return await fn();
    } catch (err) {
      const { value, done } = delays.next();

      if (done) {
        throw err;
      }

      if (retryCondition) {
        const tryAgain = await retryCondition(err);
        if (!tryAgain) {
          throw err;
        }
      }

      // $FlowIgnore done is false, so it's a yielded number (and not an undefined return value)
      await wait(value);

      return doTry();
    }
  };

  return doTry();
}

export { retry };
