import express from "express";
import { impactRoutes } from "./routes/impactRoutes.js";

const app = express();
app.use(express.json());

app.use("/impacts", impactRoutes);

export default app;
