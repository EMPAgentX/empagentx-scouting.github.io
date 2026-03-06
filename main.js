const file = "./csvs/current.csv";

Papa.parse(file, {
  download: true,
  complete: function(results) {
    const data = results.data;
    const teams = {};  // Object to store aggregated team data

    // Process each row (expecting at least 25 columns: indexes 0–24)
    data.forEach(row => {
      if (row.length < 20) return;

      const teamNumber = row[3].trim();
      const matchNumber = row[2].trim();

      // Parse numeric columns (using 0 if not a valid number)
      const autoFuel           = parseFloat(row[7])  || 0;
      const teleFuel           = parseFloat(row[9])  || 0;

      // Non-numeric fields
      const startPos     = row[1].trim();
      const autoOutpost  = row[4].trim();
      const autoDepot    = row[5].trim();
      const autoNeutral  = row[6].trim();
      const autoClimb      = row[8].trim();
      const travelLocation = row[10].trim();
      const teleOutpost  = row[11].trim();
      const teleDepot    = row[12].trim();
      const teleNeutral  = row[13].trim();
      const endClimb       = row[14].trim();
      const died            = row[15].trim();
      const playedDefense   = row[16].trim();
      const notes           = row[17].trim();


      // Initialize the team object if it doesn't exist
      if (!teams[teamNumber]) {
        teams[teamNumber] = {
          teamNumber: teamNumber,
          matchNumbers: [],
          autoFuelSum: 0,
          teleFuelSum: 0,
          endPositionCounts: {},
          climbingMechanism: null,
          cardList: [],
          commentList: [],
          count: 0
        };
      }

      const team = teams[teamNumber];

      // Collect match numbers and sum numeric values
      team.matchNumbers.push(matchNumber);
      team.autoFuelSum += autoFuel;
      team.teleFuelSum += teleFuel;      

      // Tally end position occurrences
      if (endClimb) {
        team.endPositionCounts[endClimb] = (team.endPositionCounts[endClimb] || 0) + 1;
      }

      // Append comments
      if (notes) {
        team.commentList.push(notes);
      }

      team.count++;
    });


    // Clear out any previous content
    const container = document.getElementById("teamsContainer");
    container.innerHTML = "";

    // Convert teams object to an array
    const teamsArray = Object.values(teams);

    // Calculate each team's numeric average points and store it for sorting
    teamsArray.forEach(team => {
      const count = team.count;
      const autoFuelAvg = team.autoFuelSum / count;
      const teleFuelAvg = team.teleFuelSum / count;

      team.avgPointsNum = 
        (autoFuelAvg * 1) +
        (teleFuelAvg * 1);
    });

    // Sort teams in descending order by avgPointsNum
    teamsArray.sort((a, b) => b.avgPointsNum - a.avgPointsNum);

    // Create a collapsible dropdown for each team in the sorted order
    teamsArray.forEach(team => {
      const count = team.count;

      // Compute averages for display
      const movedAvgNum              = team.movedSum / count;
      const autoFuelAvgNum           = team.autoFuelSum / count;
      const teleFuelAvgNum           = team.teleFuelSum / count;

      // Compute formatted averages
      const movedAvg           = movedAvgNum.toFixed(2);
      const autoFuelAvg        = autoFuelAvgNum.toFixed(2);
      const teleFuelAvg        = teleFuelAvgNum.toFixed(2);

      // Format the average points for display
      const avgPoints = team.avgPointsNum.toFixed(2);

      // Build end position counts string
      let endPositionsStr = "";
      for (const pos in team.endPositionCounts) {
        endPositionsStr += `${pos}: ${team.endPositionCounts[pos]} `;
      }
      endPositionsStr = endPositionsStr.trim();

      // Determine climbing mechanism; default to "DC" if none was found
      const climbingMechanism = team.climbingMechanism ? team.climbingMechanism : "DC";

      // Summarize cards (only Yellow/Red)
      const cardCounts = team.cardList.reduce((acc, card) => {
        acc[card] = (acc[card] || 0) + 1;
        return acc;
      }, {});
      let cardStr = "";
      for (const card in cardCounts) {
        cardStr += `${card}: ${cardCounts[card]} `;
      }
      cardStr = cardStr.trim();

      // Concatenate comments (each truncated to about 50 characters)
      const commentsStr = team.commentList.map(c => c.substring(0,50)).join(" | ");

      // Construct detailed text summary
      const detailsText = `
Matches: [${team.matchNumbers.join(', ')}]
Avg Points: ${avgPointsSum}
      `;

      // Create the details element and set its inner HTML
      const detailsEl = document.createElement("details");
      const summaryEl = document.createElement("summary");
      summaryEl.textContent = `Team ${team.teamNumber}`;
      detailsEl.appendChild(summaryEl);

      const infoEl = document.createElement("pre");
      infoEl.classList.add("team-info");
      infoEl.textContent = detailsText;
      detailsEl.appendChild(infoEl);

      // Append the details block to the container
      container.appendChild(detailsEl);
    });
  },
  error: function(err) {
    console.error("Error parsing CSV:", err);
  }
});