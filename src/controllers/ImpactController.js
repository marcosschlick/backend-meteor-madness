import ImpactService from "../services/ImpactService.js";

export default class ImpactController {
  static async postImpact(req, res) {
    try {
      const impactService = new ImpactService();

      const impact = await impactService.postImpact(
        req.body.diameter,
        req.body.velocity,
        req.body.lat,
        req.body.lon
      );

      res.status(200).json(impact);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getRealAsteroids(req, res) {
    try {
      const impactService = new ImpactService();

      const asteroids = await impactService.getRealAsteroids();

      res.status(200).json(asteroids);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
