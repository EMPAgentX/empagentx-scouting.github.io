async function fetchSummary() {
  const container = document.getElementById("team-container");
  container.innerHTML = `<p>Loading...</p>`;

  try {
    const res = await fetch("/api/summary");
    if (!res.ok) {
      container.innerHTML = `<p style="color: red;">Summary not found. Try generating it first.</p>`;
      return;
    }

    const data = await res.json();
    renderCards(data);

  } catch (err) {
    container.innerHTML = `<p style="color: red;">Error loading summary.</p>`;
    console.error(err);
  }
}

function renderCards(summary) {
  const container = document.getElementById("team-container");
  container.innerHTML = "";

  summary.forEach(team => {
    // Create details element (dropdown)
    const details = document.createElement("details");
    details.className = "team-card";
    details.open = false; // start closed

    // Summary / header
    const summaryEl = document.createElement("summary");
    summaryEl.textContent = `Team ${team.teamNumber} — Avg: ${team.averageScore.toFixed(2)}`;
    summaryEl.style.cursor = "pointer";
    summaryEl.style.fontWeight = "bold";
    summaryEl.style.fontSize = "1.2rem";
    details.appendChild(summaryEl);

    // Content inside dropdown
    const content = document.createElement("div");
    content.style.marginTop = "10px";

    content.innerHTML = `
      <p><strong>Matches:</strong> ${team.matches.join(", ")}</p>
      <p><strong>Notes:</strong></p>
      <ul>
        ${team.notes.map(n => `<li>${n}</li>`).join("")}
      </ul>
    `;

    details.appendChild(content);
    container.appendChild(details);
  });
}

// Button handlers
document.getElementById("generate-btn").addEventListener("click", async () => {
  await fetch("/api/summary/generate");
  fetchSummary();
});

document.getElementById("reload-btn").addEventListener("click", fetchSummary);

// Load data on page load
fetchSummary();
