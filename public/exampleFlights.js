// exampleFlights.js
const { createOpenSkyClient } = require('./openskyClient');

(async () => {

  // CONFIG — change as needed
  const AIRPORT = "OMAA";   // Abu Dhabi airport (example)
  const HOURS = 2;          // last 2 hours of arrivals
  const AUTH_MODE = "anon"; // "anon", "legacy", or "oauth"

  const endSec = Math.floor(Date.now() / 1000);
  const beginSec = endSec - HOURS * 3600;

  let client;

  if (AUTH_MODE === "anon") {
    client = createOpenSkyClient({
      authenticated: false,   // no login
      dailyBudget: 400        // OpenSky anonymous credit limit
    });
  }

  // ---- Optional: If you have legacy username/password ----
  // else if (AUTH_MODE === "legacy") {
  //   client = createOpenSkyClient({
  //     authenticated: true,
 //     dailyBudget: 4000,
 //     auth: {
  //       username: process.env.OPEN_SKY_USER,
  //       password: process.env.OPEN_SKY_PASS
  //     }
  //   });
  // }

  // ---- Optional: If you have OAuth2 token ----
  // else if (AUTH_MODE === "oauth") {
  //   client = createOpenSkyClient({
  //     authenticated: true,
 //     dailyBudget: 4000,
 //     accessToken: process.env.OPEN_SKY_ACCESS_TOKEN
  //   });
  // }

  try {
    console.log("Fetching arrivals…");
    const arrivals = await client.getFlightsArrival(AIRPORT, beginSec, endSec);

    console.log(`Arrivals in last ${HOURS} hours:`, arrivals.length);
    console.log(arrivals);

  } catch (err) {
    console.error("OpenSky error:", err.message);
    if (err.response?.data) console.error("Server response:", err.response.data);
  }
})();