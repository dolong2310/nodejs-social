import type { ExpressRequest, ExpressRequestHandler, ExpressResponse } from '@/presentation/http/express/types';

/**
 * Runs Express-style middleware inside a custom route pipeline.
 *
 * Do not pass the outer Express `next` here: middleware/pipe `next()` should
 * advance only to the next pipeline step, not fall through to the next Express
 * router layer and accidentally send a 404 before the controller runs.
 *
 * The response listeners handle middleware that ends the response itself
 * (for example rate-limit 429) instead of calling `next()`.
 */
export function runRequestHandler(
  handler: ExpressRequestHandler,
  req: ExpressRequest,
  res: ExpressResponse
): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      res.off('finish', onResponseDone);
      res.off('close', onResponseDone);
    };

    const settle = (callback: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback();
    };

    const onResponseDone = () => settle(resolve);

    res.once('finish', onResponseDone);
    res.once('close', onResponseDone);

    try {
      const result = handler(req, res, (error?: unknown) => {
        if (error) {
          settle(() => reject(error));
          return;
        }

        settle(resolve);
      });

      Promise.resolve(result).catch((error) => settle(() => reject(error)));
    } catch (error) {
      settle(() => reject(error));
    }
  });
}
