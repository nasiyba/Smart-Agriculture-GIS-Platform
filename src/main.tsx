import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@arcgis/core/assets/esri/themes/light/main.css";
import "./styles/theme.css";
import "./styles/layout.css";
import "./styles/dashboard.css";

// Keep the development console focused on actionable issues.
// ArcGIS 4.32+ still supports these legacy widgets, but logs deprecation
// notices while the app uses them. We filter only those known notices;
// real warnings and errors continue to appear normally.
const originalWarn = console.warn.bind(console);
const originalInfo = console.info.bind(console);
const originalLog = console.log.bind(console);

console.warn = (...args: unknown[]) => {
  const message = args.map(String).join(" ");
  const isArcGISLegacyWidgetNotice =
    message.includes("[esri.widgets.") &&
    message.includes("DEPRECATED") &&
    message.includes("component instead");

  if (!isArcGISLegacyWidgetNotice) {
    originalWarn(...args);
  }
};

const isKnownDevNoise = (args: unknown[]) => {
  const message = args.map(String).join(" ");
  return (
    message.includes("Download the React DevTools for a better development experience") ||
    message.includes("Using Calcite Components")
  );
};

console.info = (...args: unknown[]) => {
  if (!isKnownDevNoise(args)) originalInfo(...args);
};

console.log = (...args: unknown[]) => {
  if (!isKnownDevNoise(args)) originalLog(...args);
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
