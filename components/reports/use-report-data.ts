import { useEffect, useRef, useState, useTransition } from "react";

export function useReportData<T, D extends unknown[]>(
  fetcher: (...args: D) => Promise<T>,
  deps: D
): { data: T | null; loading: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [isPending, startTransition] = useTransition();
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    startTransition(async () => {
      const result = await fetcher(...deps);
      if (id === requestId.current) setData(result);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading: isPending || data === null };
}
