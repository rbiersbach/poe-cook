import React, { useState } from "react";
import { TradeSearchJsonInput } from "../components/TradeSearchJsonInput";
import './index.css';

export default function IndexPage() {
    const [results, setResults] = useState<any[]>([]);

    const handleJsonSubmit = async (json: any) => {
        try {
            const res = await fetch("/api/trade-search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(json),
            });
            const data = await res.json();
            setResults(data.result || []);
        } catch (e) {
            alert("Error submitting request");
        }
    };

    return (
        <div>
            <TradeSearchJsonInput onSubmit={handleJsonSubmit} />
            {/* Render results below */}
            <div>
                <h2>Results</h2>
                <ul>
                    {results.map((r, i) => (
                        <li key={i}>
                            {r.id} - {r.listing?.price?.amount} {r.listing?.price?.currency}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}