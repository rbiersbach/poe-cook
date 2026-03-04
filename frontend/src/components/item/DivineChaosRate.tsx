import { useEffect, useState } from "react";
import { DefaultService } from "../../api/generated/services/DefaultService";
import { useLeague } from "../../context/LeagueContext";
import CurrencyIcon from "./CurrencyIcon";

export function DivineChaosRate() {
    const { league } = useLeague();
    const [divineRate, setDivineRate] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!league) return;
        setLoading(true);
        DefaultService.getApiLeagueExchangeRates(league.id)
            .then((res) => {
                const divine = res.rates.find((r) => r.id === "divine");
                setDivineRate(divine?.chaosValue ?? null);
            })
            .catch(() => setDivineRate(null))
            .finally(() => setLoading(false));
    }, [league?.id]);

    if (!league || loading || divineRate === null) return null;

    return (
        <div
            data-testid="divine-chaos-rate"
            className="ml-auto flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
            <span>1</span>
            <CurrencyIcon currency="divine" className="inline w-5 h-5 align-middle" />
            <span>=</span>
            <span>{Math.round(divineRate)}</span>
            <CurrencyIcon currency="chaos" className="inline w-5 h-5 align-middle" />
        </div>
    );
}
