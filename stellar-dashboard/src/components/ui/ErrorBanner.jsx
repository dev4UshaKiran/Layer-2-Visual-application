export default function ErrorBanner({ message }) {
  return (
    <div
      style={{
        background: "#fef2f2",
        border: "1px solid #fecaca",
        borderRadius: 8,
        padding: "12px 16px",
        color: "#ff4d4d",
        fontSize: 12,
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      ⚠ {message}
    </div>
  );
}
