export default class ImpactService {
  async postImpact(diameter, velocity, lat, lon) {
    try {
      const { kineticEnergy, tntEquivalent } = calculateImpactEnergy(
        diameter,
        velocity
      );

      const radius = estimateCraterDiameter(kineticEnergy) / 2;

      return {
        kineticEnergy,
        tnt: tntEquivalent,
        craterRadius: radius,
        seismicMagnitude: calculateSeismicMagnitude(kineticEnergy),
        blastRadius: calculateBlastRadius(tntEquivalent),
        riskLevel: classifyRisk(tntEquivalent),
        affectedArea:
          Math.PI * Math.pow(calculateBlastRadius(tntEquivalent), 2),
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getRealAsteroids() {
    try {
      const apiKey = process.env.NASA_API_KEY || "DEMO_KEY";
      const response = await fetch(
        `https://api.nasa.gov/neo/rest/v1/neo/browse?api_key=${apiKey}`
      );
      const data = await response.json();

      return data.near_earth_objects
        .map((asteroid) => ({
          id: asteroid.id,
          name: asteroid.name,
          diameter: asteroid.estimated_diameter.meters.estimated_diameter_max,
          velocity:
            asteroid.close_approach_data?.[0]?.relative_velocity
              ?.kilometers_per_second * 1000 || 25000,
          hazardous: asteroid.is_potentially_hazardous_asteroid,
        }))
        .filter((asteroid) => asteroid.diameter > 0);
    } catch (error) {
      console.error("Erro ao buscar dados NASA:", error);
      return [];
    }
  }
}

// diameter - meters
// velocity - meters per second
// density - kg/m³
function calculateImpactEnergy(diameter, velocity, density = 3000) {
  const PI = Math.PI;
  const TNT_ENERGY_JOULE = 4.184e9;

  const radius = diameter / 2;
  const volume = (4 / 3) * PI * Math.pow(radius, 3);

  const mass = density * volume;
  const kineticEnergy = 0.5 * mass * Math.pow(velocity, 2);
  const tntEquivalent = kineticEnergy / TNT_ENERGY_JOULE;

  return {
    diameter: diameter,
    velocity: velocity,
    density: density,
    kineticEnergy: kineticEnergy,
    tntEquivalent: tntEquivalent,
  };
}

function estimateCraterDiameter(kineticEnergy) {
  // const for rock asteroid
  const k = 0.07;
  const diameterFromEnergy = k * Math.pow(kineticEnergy, 1 / 3.4);

  return diameterFromEnergy;
}

function calculateSeismicMagnitude(kineticEnergy) {
  return (2 / 3) * Math.log10(kineticEnergy) - 5.87;
}

function calculateBlastRadius(tntEquivalent) {
  return 1000 * Math.pow(tntEquivalent / 1000, 1 / 3);
}

function classifyRisk(tntEquivalent) {
  if (tntEquivalent < 1000) return "Baixo";
  if (tntEquivalent < 1000000) return "Average";
  if (tntEquivalent < 1000000000) return "High";
  return "Catastrophic";
}
