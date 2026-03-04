import { createContext, useContext } from "react";

const noop = (_message?: string) => {};

export const RateLimitContext = createContext<{ triggerRateLimit: (message?: string) => void }>({ triggerRateLimit: noop });

export function useRateLimit() {
    return useContext(RateLimitContext);
}
