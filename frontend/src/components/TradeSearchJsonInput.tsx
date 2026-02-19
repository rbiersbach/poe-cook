import React, { useState } from "react";

export function TradeSearchJsonInput({ onSubmit }: { onSubmit: (json: any) => void }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    try {
      const parsed = JSON.parse(input);
      setError("");
      onSubmit(parsed);
    } catch (e) {
      setError("Invalid JSON");
    }
  };

  return (
    <div className="w-full max-w-xl bg-white rounded shadow p-6 flex flex-col">
      <label htmlFor="trade-json" className="block text-lg font-semibold mb-2">
        TradeSearchRequest JSON
      </label>
      <textarea
        id="trade-json"
        className="w-full border border-gray-300 rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
        rows={8}
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Paste TradeSearchRequest JSON here"
      />
      <div className="flex items-center">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition mr-4"
          onClick={handleSubmit}
        >
          Submit
        </button>
        {error && <div className="text-red-600 font-medium">{error}</div>}
      </div>
    </div>
  );
}