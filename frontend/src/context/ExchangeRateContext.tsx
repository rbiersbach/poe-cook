import React, { createContext, useContext, useEffect, useState } from "react";
import { DefaultService } from "../api/generated/services/DefaultService";
import { useLeague } from "./LeagueContext";

interface ExchangeRateContextValue {
    /** Chaos value of 1 divine orb, or null if not yet loaded */
    divineRate: number | null;
}

const ExchangeRateContext = createContext<ExchangeRateContextValue>({ divineRate: null });

export function ExchangeRateProvider({ children }: { children: React.ReactNode }) {
    const { league } = useLeague();
    const [divineRate, setDivineRate] = useState<number | null>(null);

    useEffect(() => {
        if (!league) return;
        DefaultService.getApiLeagueExchangeRate(league.id, "divine")
            .then((res) => setDivineRate(res.rate.chaosValue))
            .catch(() => setDivineRate(null));
    }, [league?.id]);

    return (
        <ExchangeRateContext.Provider value={{ divineRate }}>
            {children}
        </ExchangeRateContext.Provider>
    );
}

export function useExchangeRate(): ExchangeRateContextValue {
    return useContext(ExchangeRateContext);
}
