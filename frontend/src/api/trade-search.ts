const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:3001";

export async function submitTradeSearch(json: any) {
  const res = await fetch(`${API_BASE}/api/trade-search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(json),
  });
  if (!res.ok) throw new Error("API request failed");
  return res.json();
}