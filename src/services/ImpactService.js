import Decimal from "decimal.js";

export default class ImpactService {
  async postImpact(diameter, velocity, lat, lon) {
    try {
      const { kineticEnergy, tntEquivalent } = calculateImpactEnergy(
        diameter,
        velocity
      );

      const radius = estimateCraterDiameter(kineticEnergy).div(2);
      const blastRadius = calculateBlastRadius(tntEquivalent);

      // Estimate casualties based on location and impact energy
      let estimatedDeaths = 0;
      if (lat && lon) {
        estimatedDeaths = await this.estimateCasualties(
          lat,
          lon,
          blastRadius,
          tntEquivalent
        );
      }

      return {
        kineticEnergy: kineticEnergy.toNumber(),
        tnt: tntEquivalent.toNumber(),
        craterRadius: radius.toNumber(),
        seismicMagnitude: calculateSeismicMagnitude(kineticEnergy).toNumber(),
        blastRadius: blastRadius.toNumber(),
        riskLevel: classifyRisk(tntEquivalent),
        affectedArea: new Decimal(Math.PI).times(blastRadius.pow(2)).toNumber(),
        estimatedDeaths: estimatedDeaths,
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

  async estimateCasualties(lat, lon, blastRadius, tntEquivalent) {
    try {
      // Use OpenStreetMap Nominatim for location data
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`
      );
      const locationData = await response.json();

      const populationDensity = this.getPopulationDensity(locationData);
      const affectedPopulation = this.calculateAffectedPopulation(
        populationDensity,
        blastRadius
      );

      return Math.round(
        affectedPopulation * this.getLethalityFactor(tntEquivalent)
      );
    } catch (error) {}
  }

  // Estimate population density based on location type
  // Returns: people per km²
  getPopulationDensity(locationData) {
    const address = locationData.address;

    if (address.city || address.town) {
      return 2000; // people per km² (urban area)
    } else if (address.village || address.hamlet) {
      return 500; // people per km² (rural area)
    } else {
      return 50; // people per km² (remote area)
    }
  }

  // Calculate affected population within blast radius
  // density - people per km²
  // blastRadius - meters (Decimal)
  // Returns: estimated number of people affected
  calculateAffectedPopulation(density, blastRadius) {
    const blastRadiusKm = blastRadius.div(1000);
    const areaKm2 = new Decimal(Math.PI).times(blastRadiusKm.pow(2));
    return areaKm2.times(density).toNumber();
  }

  // Determine lethality factor based on impact energy
  // tntEquivalent - tons of TNT (Decimal)
  // Returns: lethality percentage (0.0 to 1.0)
  getLethalityFactor(tntEquivalent) {
    const tnt = tntEquivalent.toNumber();
    if (tnt < 1000) return 0.1; // 10% lethality
    if (tnt < 100000) return 0.3; // 30%
    if (tnt < 1000000) return 0.6; // 60%
    return 0.9; // 90% for catastrophic impacts
  }
}

// Calculate kinetic energy and TNT equivalent of impact
// diameter - meters
// velocity - meters per second
// density - kg/m³ (default for stony asteroids)
// Returns: {kineticEnergy: Decimal, tntEquivalent: Decimal}
function calculateImpactEnergy(diameter, velocity, density = 3000) {
  const PI = new Decimal(Math.PI);
  const TNT_ENERGY_JOULE = new Decimal(4.184e9); // joules per ton of TNT

  const radius = new Decimal(diameter).div(2);
  const volume = new Decimal(4).div(3).times(PI).times(radius.pow(3));

  const mass = new Decimal(density).times(volume); // kg
  const kineticEnergy = new Decimal(0.5)
    .times(mass)
    .times(new Decimal(velocity).toPower(2)); // joules
  const tntEquivalent = kineticEnergy.div(TNT_ENERGY_JOULE); // tons

  return {
    diameter: diameter,
    velocity: velocity,
    density: density,
    kineticEnergy: kineticEnergy,
    tntEquivalent: tntEquivalent,
  };
}

// Estimate crater diameter based on impact energy
// kineticEnergy - joules (Decimal)
// Returns: crater diameter in meters (Decimal)
function estimateCraterDiameter(kineticEnergy) {
  // Scaling constant for rock asteroids
  const k = new Decimal(0.07);
  const diameterFromEnergy = k.times(kineticEnergy.pow(1 / 3.4));

  return diameterFromEnergy;
}

// Calculate equivalent seismic magnitude
// kineticEnergy - joules (Decimal)
// Returns: Richter scale magnitude (Decimal)
function calculateSeismicMagnitude(kineticEnergy) {
  return new Decimal(2)
    .div(3)
    .times(new Decimal(kineticEnergy).log(10))
    .minus(5.87);
}

// Calculate blast radius of impact
// tntEquivalent - tons of TNT (Decimal)
// Returns: blast radius in meters (Decimal)
function calculateBlastRadius(tntEquivalent) {
  return new Decimal(1000).times(tntEquivalent.div(1000).pow(1 / 3));
}

// Classify risk level based on impact energy
// tntEquivalent - tons of TNT (Decimal)
// Returns: risk category string
function classifyRisk(tntEquivalent) {
  const tnt = tntEquivalent.toNumber();
  if (tnt < 1000) return "Low"; // < 1 kiloton
  if (tnt < 1000000) return "Average"; // < 1 megaton
  if (tnt < 1000000000) return "High"; // < 1 gigaton
  return "Catastrophic"; // ≥ 1 gigaton
}
