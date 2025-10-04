import ImpactService from "../services/ImpactService.js";

export default class ImpactController {
  static async getImpact(req, res) {
    try {
      const impactService = new ImpactService();

      const impact = await impactService.getImpact(
        req.body.size,
        req.body.speed,
        req.body.lat,
        req.body.lon
      );

      res.status(200).json(impact);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
