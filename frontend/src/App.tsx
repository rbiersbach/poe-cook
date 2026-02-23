import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { TradeSearchJsonInput } from "components/TradeSearchJsonInput";
import { TradeSearchResults } from "components/TradeSearchResults";
import { TradeSearchRequest, DefaultService } from "api/generated";
import CreateRecipePage from "./pages/CreateRecipePage";

function MainSearch() {
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

function App() {
  return (
    <Router>
      <nav className="w-full bg-white shadow mb-6 py-4 px-8 flex gap-6">
        <Link to="/" className="text-blue-700 font-semibold hover:underline">Trade Search</Link>
        <Link to="/create" className="text-blue-700 font-semibold hover:underline">Create Recipe</Link>
      </nav>
      <Routes>
        <Route path="/" element={<MainSearch />} />
        <Route path="/create" element={<CreateRecipePage />} />
      </Routes>
    </Router>
  );
}

export default App;
