import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { db } from "./db";

if (import.meta.env.DEV) {
  (window as any).db = db;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
