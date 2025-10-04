import { Router } from "express";

import ImpactController from "../controllers/ImpactController.js";

const router = new Router();

router.get("/", ImpactController.getImpact);

export { router as impactRoutes };
