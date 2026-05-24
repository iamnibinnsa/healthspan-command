import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "MediTwin Core Brain",
    hasAnthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
  });
});

const port = Number(process.env.PORT || 8787);

app.listen(port, () => {
  console.log(`MediTwin Core Brain running on http://localhost:${port}`);
});