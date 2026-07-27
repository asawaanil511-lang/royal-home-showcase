import { createRoot } from "react-dom/client";
import { Component, ReactNode, useEffect } from "react";
import App from "./App.tsx";
import "./index.css";

// Hide the HTML-level loader as soon as this module runs (JS bundle parsed)
const hideLoader = () => {
  if (typeof (window as any).__hideLoader === "function") {
    (window as any).__hideLoader();
  }
};

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: "" };
  }

  static getDerivedStateFromError(error: Error) {
    hideLoader();
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#0a0c15",
            color: "#fff",
            padding: "2rem",
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⚡</div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            RS Toss Book
          </h2>
          <p style={{ color: "#aaa", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            Something went wrong loading the app.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "linear-gradient(135deg, #00d4b4, #0099ff)",
              color: "#fff",
              border: "none",
              borderRadius: "0.75rem",
              padding: "0.75rem 2rem",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Tap to Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Dismiss loader when App first renders
function LoaderDismisser() {
  useEffect(() => { hideLoader(); }, []);
  return null;
}

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(
    <ErrorBoundary>
      <LoaderDismisser />
      <App />
    </ErrorBoundary>
  );
}
