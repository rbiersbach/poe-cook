import { ExchangeRate } from "models/ninja-types";
import path from "path";
import { fileURLToPath } from "url";
import { GenericStore, IGenericStore } from "./generic-store";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_EXCHANGE_RATES_PATH = path.join(__dirname, "../../data/exchange-rates.json");

export interface IExchangeRateStore extends IGenericStore<ExchangeRate> { }

export class ExchangeRateStore extends GenericStore<ExchangeRate> implements IExchangeRateStore {
    constructor(filePath?: string) {
        super(filePath || DEFAULT_EXCHANGE_RATES_PATH);
    }
}
