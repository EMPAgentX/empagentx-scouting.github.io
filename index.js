const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const webhookUrl = 'https://webhook.site/6f52b515-741f-4ab9-96b1-dd97979b586c';
const webhookUrl_Startup = 'https://webhook.site/6f52b515-741f-4ab9-96b1-dd97979b586c';

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "../client"))); // Serves your frontend files

// Paths to data files
const dataFilePath = path.join(__dirname, "../data/data.json");
const summaryFilePath = path.join(__dirname, "../data/summary.json");

// Helper function to read/write raw data
function readData() {
  if (!fs.existsSync(dataFilePath)) return [];
  const file = fs.readFileSync(dataFilePath);
  return JSON.parse(file);
}

function writeData(newData) {
  fs.writeFileSync(dataFilePath, JSON.stringify(newData, null, 2));
}

// =========================
// SUMMARY GENERATOR LOGIC
// =========================
function generateSummary() {
  const rawData = readData();

  const teams = {};

  for (const item of rawData) {
    const team = item.teamNumber;

    if (!teams[team]) {
      teams[team] = {
        teamNumber: team,
        autoFuel: [],
        teleFuel: [],
        matches: [],
        startPos: [],
        travelLocation: [],
        pickupLocations: [],
        notes: [],

      };
    }

    
    teams[team].autoFuel.push(Number(item.autoFuel));
    teams[team].teleFuel.push(Number(item.teleFuel));
    teams[team].matches.push(Number(item.matchNumber));
    teams[team].startPos.push(item.startPos);
    teams[team].pickupLocations.push(item.autoOutpost + " " + item.autoDepot + " " + item.autoNeutral + " " + item.teleopOutpost + " " + item.teleopDepot + " " + item.teleopNeutral);
    teams[team].travelLocation.push(item.travelLocation);
    teams[team].died.push(item.died);
    teams[team].Climb.push(item.endClimb + " " + item.autoClimb);
    if (item.notes && item.notes.trim() !== "") {
      teams[team].notes.push(item.notes.trim());
    }
  }

  const summary = Object.values(teams).map(team => ({
    teamNumber: team.teamNumber,
    averageFuel: team.autoFuel.reduce((a, b) => a + b, 0) / team.autoFuel.length,
    matches: team.matches,
    startPos: team.startPos,
    pickupLocations: team.pickupLocations,

    notes: team.notes
  }));

  return summary;
}

function writeSummary(summaryData) {
  fs.writeFileSync(summaryFilePath, JSON.stringify(summaryData, null, 2));
}

// =========================
// API ROUTES
// =========================

// Handle raw submissions
app.post("/api/submit", (req, res) => {
  const data = req.body;

  if (!data.teamNumber || !data.matchNumber || !data.autoFuel || !data.startPos) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const currentData = readData();
  currentData.push({
    ...data,
    timestamp: new Date().toISOString(),
  });

  writeData(currentData);

  console.log("✅ Data received:", data);
  res.json({ message: "Data successfully saved!" });
});

// Generate summary.json
app.get("/api/summary/generate", (req, res) => {
  const summary = generateSummary();
  writeSummary(summary);
  res.json({ message: "Summary generated", summary });
});

// Return summary.json contents
app.get("/api/summary", (req, res) => {
  if (!fs.existsSync(summaryFilePath)) {
    return res.status(404).json({ message: "summary.json not found. Generate it first." });
  }

  const summaryData = JSON.parse(fs.readFileSync(summaryFilePath));
  res.json(summaryData);
});

// =========================
// START SERVER
// =========================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
