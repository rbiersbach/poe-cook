import React, { useState } from "react";
import { TradeSearchJsonInput } from "./components/TradeSearchJsonInput";

function App() {
  const [results, setResults] = useState<any[]>([]);

  const handleJsonSubmit = async (json: any) => {
    // ...existing fetch logic...
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start py-10">
      <TradeSearchJsonInput onSubmit={handleJsonSubmit} />
      <section className="mt-8 w-full max-w-xl bg-white rounded shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Results</h2>
        <ul>
          {results.map((r, i) => (
            <li key={i} className="mb-2">
              {r.id} - {r.listing?.price?.amount} {r.listing?.price?.currency}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default App;
