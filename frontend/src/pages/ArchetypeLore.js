import { useParams } from "react-router-dom";
import { archetypeLore } from "../data/archetypeLore";

export default function ArchetypeLore() {
  const { name } = useParams();
  const data = archetypeLore[name];

  if (!data) {
    return <p>Unknown archetype.</p>;
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <h1>{data.title}</h1>
      <p style={{ fontStyle: "italic", color: "#555" }}>
        {data.essence}
      </p>

      {/* CORE LORE */}
      <section style={{ marginTop: 24 }}>
        <h2>Essence</h2>
        <p style={{ whiteSpace: "pre-line" }}>{data.coreLore}</p>
      </section>

      {/* PATH / STAGES */}
      <section style={{ marginTop: 32 }}>
        <h2>The Path</h2>

        {data.stages.map((stage, i) => (
          <div
            key={stage.name}
            style={{
              borderLeft: "3px solid #222",
              paddingLeft: 16,
              marginBottom: 20
            }}
          >
            <h3>
              {i + 1}. {stage.name}
            </h3>
            <p><b>Meaning:</b> {stage.meaning}</p>
            <p><b>Challenge:</b> {stage.challenge}</p>
          </div>
        ))}
      </section>

      {/* SHADOW */}
      <section style={{ marginTop: 32 }}>
        <h2>The Shadow — {data.shadow.name}</h2>
        <p style={{ whiteSpace: "pre-line" }}>
          {data.shadow.description}
        </p>

        <h3>Integration</h3>
        <p style={{ whiteSpace: "pre-line" }}>
          {data.shadow.integration}
        </p>
      </section>

      {/* PRACTICES */}
      <section style={{ marginTop: 32 }}>
        <h2>Practices</h2>
        <ul>
          {data.practices.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
