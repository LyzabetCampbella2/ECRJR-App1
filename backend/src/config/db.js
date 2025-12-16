const mongoose = require("mongoose");
const { getQuestions } = require("../utils/testQuestions");
function getTestQuestions(req, res) {
  const { testId } = req.params;
  const questions = getQuestions(testId);

  res.json({
    success: true,
    testId,
    questions
  });
}

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI missing in .env");
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log("✅ MongoDB connected");
}

module.exports = { startTest, submitTest, getProgress, getTestQuestions };

