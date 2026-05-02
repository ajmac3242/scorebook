import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { db, AppDatabase } from "./db";

/* eslint-disable no-unused-vars */
declare global {
  interface Window {
    db?: AppDatabase;
  }
}
/* eslint-enable no-unused-vars */

if (import.meta.env.DEV) {
  window.db = db;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
