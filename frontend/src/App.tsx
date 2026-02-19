import React, { useState } from "react";
import { TradeSearchJsonInput } from "components/TradeSearchJsonInput";
import { TradeSearchResults } from "components/TradeSearchResults";
import { TradeSearchRequest, DefaultService } from "api/generated";

function App() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJsonSubmit = async (json: TradeSearchRequest) => {
    setLoading(true);
    setError("");
    try {
      const data = await DefaultService.postApiTradeSearch(json);
      setResults(data.result || []);
    } catch (e) {
      setError("Error submitting request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start py-10">
      <TradeSearchJsonInput onSubmit={handleJsonSubmit} />
      {error && (
        <div data-testid="app-error" className="text-red-600 font-medium mt-4">
          {error}
        </div>
      )}
      {loading ? (
        <div className="mt-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-blue-600 font-medium">Loading...</span>
        </div>
      ) : (
        <TradeSearchResults results={results} />
      )}
    </div>
  );
}

export default App;
