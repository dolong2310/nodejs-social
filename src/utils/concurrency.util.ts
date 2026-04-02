/**
 * hàm tiện ích để chạy một tác vụ bất đồng bộ trên nhiều phần tử, nhưng giới hạn số tác vụ chạy đồng thời (concurrency).
 * Mục tiêu là tránh "excute" quá nhiều request/IO/CPU cùng lúc gây nghẽn (đặc biệt đúng với upload S3 nhiều file/segment hoặc xử lý Sharp/encode video).
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number, // số "worker" tối đa chạy song song
  mapper: (item: T, index: number) => Promise<R> // hàm biến đổi bất đồng bộ cho từng phần tử
): Promise<R[]> {
  // đảm bảo ít nhất là 1 concurrent worker
  const safeConcurrency = Math.max(1, concurrency);
  const results: R[] = new Array(items.length);

  // index của phần tử tiếp theo sẽ được xử lý
  let nextIndex = 0; // con trỏ chia sẻ giữa các worker

  const worker = async () => {
    while (true) {
      const currentIndex = nextIndex++;
      if (currentIndex >= items.length) return;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  };

  const workerCount = Math.min(safeConcurrency, items.length);
  const workers = new Array(workerCount).fill(0).map(() => worker());
  await Promise.all(workers);

  return results;
}
