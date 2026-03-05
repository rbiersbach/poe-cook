import { useEffect, useState } from "react";

/**
 * Returns true when the given CSS media query matches.
 * Stays in sync as the viewport resizes.
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

    useEffect(() => {
        const mql = window.matchMedia(query);
        const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
        mql.addEventListener("change", handler);
        setMatches(mql.matches); // sync initial value
        return () => mql.removeEventListener("change", handler);
    }, [query]);

    return matches;
}
