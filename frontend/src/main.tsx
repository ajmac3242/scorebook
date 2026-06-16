import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./utils/test-db-exposure";
import { type AppDatabase } from "./db";

/* eslint-disable no-unused-vars */
declare global {
  interface Window {
    db?: AppDatabase;
  }
}
/* eslint-enable no-unused-vars */


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
