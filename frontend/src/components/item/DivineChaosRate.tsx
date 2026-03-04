import { useExchangeRate } from "../../context/ExchangeRateContext";
import CurrencyIcon from "./CurrencyIcon";

export function DivineChaosRate() {
    const { divineRate } = useExchangeRate();

    if (divineRate === null) return null;

    return (
        <div
            data-testid="divine-chaos-rate"
            className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
            <span>1</span>
            <CurrencyIcon currency="divine" className="inline w-5 h-5 align-middle" />
            <span>=</span>
            <span>{Math.round(divineRate)}</span>
            <CurrencyIcon currency="chaos" className="inline w-5 h-5 align-middle" />
        </div>
    );
}
