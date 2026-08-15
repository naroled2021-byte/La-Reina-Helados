import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** True only after client-side hydration — avoids theme-driven SSR/CSR mismatches. */
export function useMounted() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
