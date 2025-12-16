export default function ArchetypeCard({ result }) {
  return (
    <div
      style={{
        width: 320,
        border: "1px solid #222",
        borderRadius: 16,
        padding: 20,
        background: "#fff"
      }}
    >
      <h3 style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {result.primary}
      </h3>

      {result.secondary && (
        <p style={{ color: "#666" }}>{result.secondary}</p>
      )}

      <p style={{ marginTop: 12 }}>
        {result.overview}
      </p>

      <p style={{ marginTop: 16, fontSize: 12, color: "#777" }}>
        Eirden Archetype System
      </p>
    </div>
  );
}
