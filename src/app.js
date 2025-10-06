import express from "express";
import cors from "cors";
import { impactRoutes } from "./routes/impactRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, "../public")));

app.use("/", impactRoutes);

export default app;