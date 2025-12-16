require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true, service: "eirden-backend" }));

app.use("/api/profiles", require("./routes/profileRoutes"));
app.use("/api/tests", require("./routes/testRoutes"));

const PORT = process.env.PORT || 5000 + Math.floor(Math.random() * 1000);


app.listen(PORT, () => {
  console.log(`✅ Backend running (in-memory) on http://localhost:${PORT}`);
});

