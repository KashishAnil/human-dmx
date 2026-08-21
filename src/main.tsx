import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { purgeLegacyState } from "./redux/persist";

// Clears the pre-API client-side store out of returning browsers before the
// first render. Everything the app shows now comes from the database.
purgeLegacyState();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
