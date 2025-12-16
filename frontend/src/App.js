import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "./api/apiClient";
import Results from "./pages/results";
import Dashboard from "./pages/dashboard";

export default function App() {
  /* =========================
     PROFILE STATE
     ========================= */
  const [displayName, setDisplayName] = useState("Lyzabet");
  const [email, setEmail] = useState("test@test.com");
  const [profile, setProfile] = useState(null);

  /* =========================
     TEST STATE
     ========================= */
  const [activeTestId, setActiveTestId] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

  /* =========================
     UI STATE
     ========================= */
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
const [booting, setBooting] = useState(true);

  /* =========================
     HELPERS
     ========================= */
  const orderedAnswers = useMemo(() => {
    return questions
      .map((q) => answers[q.id])
      .filter((v) => v !== undefined);
  }, [questions, answers]);

  /* =========================
     AUTO-RESUME ON LOAD
     ========================= */
useEffect(() => {
  const savedProfileId = localStorage.getItem("eirden_profile");
  if (!savedProfileId) {
    setBooting(false);
    return;
  }
if (booting) {
  return <p style={{ padding: 24 }}>Loading Eirden…</p>;
}

  apiGet(`/api/profiles/${savedProfileId}`)
    .then((res) => {
      setProfile(res.profile);
      setActiveTestId(res.profile.activeTestId || "");
    })
    .catch(() => {
      localStorage.removeItem("eirden_profile");
    })
    .finally(() => setBooting(false));
}, []);

  /* =========================
     API ACTIONS
     ========================= */
  async function createProfile() {
    setError("");
    setStatus("Creating profile...");

    const res = await apiPost("/api/profiles", { displayName, email });

    setProfile(res.profile);
    setActiveTestId(res.profile.activeTestId);
    localStorage.setItem("eirden_profile", res.profile._id);

    setStatus("");
  }

  async function loadQuestions(testId) {
    if (!testId) return;

    setError("");
    setStatus(`Loading ${testId}...`);

    const res = await apiGet(`/api/tests/questions/${testId}`);
    setQuestions(res.questions || []);
    setAnswers({});
    setStatus("");
  }

  async function startTest() {
    if (!profile?._id) return;

    setError("");
    setStatus("Starting test...");

    const res = await apiPost("/api/tests/start", {
      profileId: profile._id
    });

    setActiveTestId(res.testId);
    await loadQuestions(res.testId);
  }

  async function submitTest() {
    if (!profile || !activeTestId) return;

    if (orderedAnswers.length !== questions.length) {
      setError("Please answer all questions before submitting.");
      return;
    }

    setError("");
    setStatus("Submitting test...");

    const res = await apiPost("/api/tests/submit", {
      profileId: profile._id,
      testId: activeTestId,
      answers: orderedAnswers
    });

    if (res.nextTestId) {
      setActiveTestId(res.nextTestId);
      await loadQuestions(res.nextTestId);
    } else {
      setActiveTestId("");
      setQuestions([]);
    }

    setStatus("");
  }

  /* =========================
     RESET / LOGOUT
     ========================= */
  function resetProfile() {
    localStorage.removeItem("eirden_profile");
    window.location.reload();
  }

  /* =========================
     AUTO-LOAD QUESTIONS
     ========================= */
  useEffect(() => {
    if (activeTestId) {
      loadQuestions(activeTestId).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================
     RENDER
     ========================= */
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <h1>Eirden • Test System</h1>

      {/* =========================
          PROFILE PANEL
         ========================= */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 16,
          marginBottom: 24
        }}
      >
        <h2>Profile</h2>

        {!profile && (
          <>
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display name"
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
              />
            </div>

            <button
              style={{ marginTop: 12 }}
              onClick={() => createProfile().catch((e) => setError(e.message))}
            >
              Create Profile
            </button>
          </>
        )}

        {profile && (
          <>
            <p><b>Name:</b> {profile.displayName}</p>
            <p><b>Profile ID:</b> {profile._id}</p>
            <p><b>Active Test:</b> {activeTestId || "Completed"}</p>

            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              <button onClick={startTest}>Start / Resume Test</button>
              <button onClick={resetProfile}>Reset / Logout</button>
            </div>
          </>
        )}
      </div>

      {/* =========================
          DASHBOARD
         ========================= */}
      {profile && <Dashboard profile={profile} />}

      {/* =========================
          STATUS / ERRORS
         ========================= */}
      {status && <p style={{ color: "#555" }}>{status}</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {/* =========================
          TEST QUESTIONS
         ========================= */}
      {questions.length > 0 && (
        <div>
          <h2>{activeTestId}</h2>

          {questions.map((q) => (
            <div
              key={q.id}
              style={{
                border: "1px solid #eee",
                borderRadius: 12,
                padding: 16,
                marginBottom: 16
              }}
            >
              <p style={{ fontWeight: 600 }}>{q.prompt}</p>

              {q.options.map((opt, idx) => (
                <label
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 6
                  }}
                >
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers[q.id] === idx}
                    onChange={() =>
                      setAnswers((prev) => ({ ...prev, [q.id]: idx }))
                    }
                  />
                  {opt}
                </label>
              ))}
            </div>
          ))}

          <button onClick={submitTest}>Submit Test</button>
        </div>
      )}

      {/* =========================
          RESULTS
         ========================= */}
      {!activeTestId && profile && (
        <Results profileId={profile._id} />
      )}
    </div>
  );
}
