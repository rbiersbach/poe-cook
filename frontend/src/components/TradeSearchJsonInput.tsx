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
        <div className="w-full max-w-xl bg-surface rounded shadow p-6 flex flex-col" data-testid="trade-json-input">
            <label htmlFor="trade-json" className="block text-lg font-semibold mb-2 header">
                TradeSearchRequest JSON
            </label>
            <textarea
                id="trade-json"
                data-testid="trade-json-textarea"
                className="w-full border border-gray-300 dark:border-gray-700 rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-900 dark:text-gray-100"
                rows={8}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Paste TradeSearchRequest JSON here"
            />
            <div className="flex items-center">
                <button
                    data-testid="trade-json-submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition mr-4"
                    onClick={handleSubmit}
                >
                    Submit
                </button>
                {error && <div data-testid="trade-json-error" className="text-error dark:text-red-400 font-medium">{error}</div>}
            </div>
        </div>
    );
}