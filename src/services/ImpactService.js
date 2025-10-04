export default class ImpactService {
  async getImpact(diameter, velocity, lat, lon) {
    try {
      // Correção: adicionar const na destructuring
      const { kineticEnergy, tntEquivalent } = calculateImpactEnergy(
        diameter,
        velocity
      );

      // Correção: declarar a variável raio
      const raio = estimateCraterDiameter(kineticEnergy) / 2;

      return {
        kineticEnergy,
        tnt: tntEquivalent,
        craterRadius: raio,
      };
    } catch (error) {
      console.error(error);
      throw error;
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
