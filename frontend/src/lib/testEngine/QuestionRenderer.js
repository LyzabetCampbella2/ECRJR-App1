import React from "react";

export default function QuestionRenderer({ q, value, onChange }) {
  const type = (q?.type || q?.questionType || "multiple_choice").toLowerCase();

  if (type === "paragraph") {
    return (
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        placeholder="Write your answer…"
      />
    );
  }

  if (type === "fill_blank" || type === "fill-in-the-blank" || type === "short_answer") {
    return (
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your answer…"
      />
    );
  }

  if (type === "likert") {
    const opts = q.options || ["1", "2", "3", "4", "5"];
    return (
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {opts.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`btn ${value === opt ? "btn--primary" : ""}`}
            onClick={() => onChange(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }

  // default: multiple_choice
  const options = q.options || q.choices || [];
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {options.map((opt, idx) => {
        const label = typeof opt === "string" ? opt : (opt.label || opt.text || `Option ${idx + 1}`);
        const val = typeof opt === "string" ? opt : (opt.value ?? label);
        const active = value === val;

        return (
          <button
            key={val}
            type="button"
            className={`btn ${active ? "btn--primary" : ""}`}
            onClick={() => onChange(val)}
            style={{ justifyContent: "flex-start" }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
