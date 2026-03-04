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
            className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900
                       dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
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
    );
}
