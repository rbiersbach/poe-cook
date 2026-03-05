import { useEffect, useState } from "react";
import type { League } from "../../api/generated/models/League";
import { DefaultService } from "../../api/generated/services/DefaultService";
import { useLeague } from "../../context/LeagueContext";

const REALM_ORDER = ["pc", "xbox", "sony"] as const;
const REALM_LABEL: Record<string, string> = { pc: "PC", xbox: "Xbox", sony: "PlayStation" };

function leagueKey(l: League) {
    return `${l.realm}:${l.id}`;
}

export function LeaguePicker() {
    const { league, setLeague } = useLeague();
    const [leagues, setLeagues] = useState<League[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        DefaultService.getApiLeagues()
            .then((res) => {
                setLeagues(res.leagues || []);
            })
            .catch(() => {
                setLeagues([]);
            })
            .finally(() => setLoading(false));
    }, []);


    const grouped = REALM_ORDER
        .map((realm) => ({ realm, items: leagues.filter((l) => l.realm === realm) }))
        .filter((g) => g.items.length > 0);

    const selectedKey = league ? leagueKey(league) : "";

    return (
        <label className="flex h-full cursor-pointer flex-col items-start justify-center gap-2
                          px-4 py-3 lg:px-8 lg:py-4
                          text-gray-700 dark:text-gray-200
                          hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 leading-none select-none">
                League
            </span>
            <select
                data-testid="league-picker"
                value={selectedKey}
                onChange={(e) => {
                    const [realm, ...rest] = e.target.value.split(":");
                    const id = rest.join(":");
                    const found = leagues.find((l) => l.realm === realm && l.id === id);
                    if (found) setLeague(found);
                }}
                disabled={loading}
                className="cursor-pointer bg-transparent
                       text-base font-semibold text-nowrap text-gray-900 dark:text-gray-50
                       border-0 outline-none
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {!league && (
                    <option value="" disabled>
                        Select a league
                    </option>
                )}
                {grouped.map(({ realm, items }) => (
                    <optgroup key={realm} label={REALM_LABEL[realm] ?? realm}>
                        {items.map((l) => (
                            <option key={leagueKey(l)} value={leagueKey(l)}>
                                {l.text}
                            </option>
                        ))}
                    </optgroup>
                ))}
            </select>
        </label>
    );
}
