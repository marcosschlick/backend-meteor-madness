import express from "express";
import cors from "cors";
import { impactRoutes } from "./routes/impactRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/impacts", impactRoutes);

export default app;
