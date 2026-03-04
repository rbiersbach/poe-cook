import { createContext, useContext, useState } from "react";

export interface SelectedLeague {
    id: string;
    realm: string;
    text: string;
}

interface LeagueContextValue {
    league: SelectedLeague | null;
    setLeague: (league: SelectedLeague) => void;
}

const LeagueContext = createContext<LeagueContextValue | null>(null);

const STORAGE_KEY = "poe-league";

export function LeagueProvider({ children, defaultLeague }: { children: React.ReactNode; defaultLeague?: SelectedLeague }) {
    const [league, setLeagueState] = useState<SelectedLeague | null>(() => {
        if (defaultLeague !== undefined) return defaultLeague;
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? (JSON.parse(stored) as SelectedLeague) : null;
        } catch {
            return null;
        }
    });

    const setLeague = (l: SelectedLeague) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(l));
        } catch {
            // localStorage not available (e.g. in tests)
        }
        setLeagueState(l);
    };

    return (
        <LeagueContext.Provider value={{ league, setLeague }}>
            {children}
        </LeagueContext.Provider>
    );
}

export function useLeague(): LeagueContextValue {
    const ctx = useContext(LeagueContext);
    if (!ctx) throw new Error("useLeague must be used within a LeagueProvider");
    return ctx;
}
