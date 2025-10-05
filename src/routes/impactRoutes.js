import { Router } from "express";

import ImpactController from "../controllers/ImpactController.js";

const router = new Router();

router.post("/impact", ImpactController.postImpact);
router.get("/asteroids", ImpactController.getRealAsteroids);

export { router as impactRoutes };
