import React, { useState } from "react";
import { makePilotCode } from "../utils/pilotCodes";

export default function PilotCodeGen() {
  const [name, setName] = useState("");
  const code = makePilotCode(name);

  return (
    <div style={{ padding: 24 }}>
      <h2>Pilot Code Generator</h2>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tester name/handle" />
      <div style={{ marginTop: 12, fontWeight: 800 }}>{code}</div>
    </div>
  );
}
