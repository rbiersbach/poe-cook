import React from "react";

interface TradeSearchResult {
  id: string;
  price: string;
}

export function TradeSearchResults({ results }: { results: TradeSearchResult[] }) {
  if (!results.length) {
    return (
      <div className="text-gray-500 text-center">No results to display.</div>
    );
  }

  return (
    <section className="mt-8 w-full max-w-xl bg-white rounded shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Results</h2>
      <ul>
        {results.map((r, i) => (
          <li key={i} className="mb-2">
            <span className="font-mono">{r.id}</span> — <span>{r.price}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}