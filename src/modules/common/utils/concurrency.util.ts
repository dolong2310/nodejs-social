/**
 * Utility for running an async task over many items while limiting how many tasks run at the same time.
 * The goal is to avoid executing too many requests/IO/CPU tasks at once, especially for multi-file/segment S3 uploads or Sharp/video encoding.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number, // maximum number of workers running in parallel
  mapper: (item: T, index: number) => Promise<R> // async mapper for each item
): Promise<R[]> {
  // Ensure there is at least one concurrent worker.
  const safeConcurrency = Math.max(1, concurrency);
  const results: R[] = new Array(items.length);

  // Index of the next item to process.
  let nextIndex = 0; // shared cursor across workers

  const worker = async () => {
    while (true) {
      const currentIndex = nextIndex++;
      if (currentIndex >= items.length) return;
      results[currentIndex] = await mapper(items[currentIndex]!, currentIndex);
    }
  };

  const workerCount = Math.min(safeConcurrency, items.length);
  const workers = new Array(workerCount).fill(0).map(() => worker());
  await Promise.all(workers);

  return results;
}
