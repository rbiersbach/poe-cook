import React, { useState } from "react";
import { TradeSearchJsonInput } from "./components/TradeSearchJsonInput";
import { TradeSearchResults } from "./components/TradeSearchResults";
import { submitTradeSearch } from "api/tradeSearch";

function App() {
  const [results, setResults] = useState<any[]>([]);

  const handleJsonSubmit = async (json: any) => {
    try {
      const data = await submitTradeSearch(json);
      setResults(data.result || []);
    } catch (e) {
      alert("Error submitting request");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start py-10">
      <TradeSearchJsonInput onSubmit={handleJsonSubmit} />
      <TradeSearchResults results={results} />
    </div>
  );
}

export default App;
