import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

import { BrowserRouter as Router } from "react-router-dom";
import { OpenAPI } from "./api/generated/core/OpenAPI";

// Allow overriding the API base URL at build time (e.g. empty string for nginx proxy in Docker)
OpenAPI.BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);
