# Asteroid Impact Simulator

An asteroid impact simulator developed for the NASA Challenge, combining interactive 3D visualization with scientific impact calculations.

## 🚀 How to Run the Project

### 1. Clone the Repository

```bash
git clone https://github.com/marcosschlick/meteor-madness.git
cd meteor-madness
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit the .env file with your configurations
# (Replace "your_api_key_here" with your actual NASA API key)
```

**.env file:**

```env
SV_PORT=3000
NASA_API_KEY=your_api_key_here
```

### 4. Run the Project

```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

### 5. Access the Application

Open your browser and navigate to:

```
http://localhost:3000
```

## 🔑 Get NASA API Key

1. Visit: https://api.nasa.gov/
2. Click "Sign Up" to create an account
3. Quickly fill out the form
4. You'll receive an API key via email
5. Paste the key in the `.env` file at `NASA_API_KEY=your_key_here`

_If not configured, NASA's DEMO_KEY will be used (with usage limitations)._

## 🛠 Technologies Used

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, JavaScript
- **3D Visualization**: Three.js
- **Scientific Calculations**: Decimal.js
- **External API**: NASA NeoWS

## 📋 Features

- Interactive 3D simulation of asteroid impacts
- Scientific calculations of kinetic energy, crater size, and effects
- Impact location selection by clicking on the globe
- Detailed results visualization
- Integration with real asteroid data from NASA

---

**Developed for NASA Challenge 2025**
