const axios = require("axios");
const { addDoc, collection } = require("firebase/firestore");
const getLastPart = require("../utils/getLastPart");

async function logRequests(req, res, next, db) {
  const secretHeader = req.headers["x-secret-header"];
  const clientIp = req.clientIp;
  const requestUrl = req.originalUrl;
  const requestMethod = req.method;
  const userAgent = req.headers["user-agent"] || "";
  const isPostman = userAgent.toLowerCase().includes("postman") || req.headers["postman-token"];
  
  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Tokyo",
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/(\d{2})\/(\d{2})\/(\d{4}),\s(\d{2}):(\d{2}):(\d{2})/, '$3/$1/$2 $4:$5:$6');

  try {
    if (requestUrl.startsWith("/mine/")) {
        return next(); // Call next without logging for this route
    }
      
    // Fetch IP details using ip-api.com
    let ipDetails;
    try {
      const ipApiResponse = await axios.get(`http://ip-api.com/json/${clientIp}`);
      ipDetails = ipApiResponse.data;
    } catch (error) {
      ipDetails = { country: "LOCAL_TEST", regionName: "LOCAL_TEST", city: "LOCAL_TEST" };
    }
    const { country = "none", regionName = "none", city = "none" } = ipDetails;

    if (requestUrl !== "/favicon.ico" && requestUrl !== "/favicon.png") {
      // Prepare data to be logged in Firestore
      let logData = {
        country,
        regionName,
        city,
        method: secretHeader ? `${requestMethod}:${secretHeader}` : requestMethod,
        ip: clientIp,
        url: requestUrl,
        timestamp,
        source: isPostman ? "Postman" : "Web",
      };

      // Add flag and computer/user info if needed
      const fileName = requestMethod === "POST" ? getLastPart(req.body) : requestUrl.split("/").pop();
      logData.flag = fileName;

      if (requestMethod === "POST" && requestUrl.startsWith("/api/ipcheck/")) {
          const computername = `${req.body.hostname || "Unknown"} | ${req.body.username || "Unknown"}`;
          logData.computername = computername;
          logData.os = req.body.OS || "Unknown";
          logData.platform = req.body.platform || "Unknown";
          logData.macAddresses = req.body.macAddresses || [];
      }

      // Log the request to Firestore
      console.log("request made", logData);
      await addDoc(collection(db, "request_history"), logData);
    }

    // Skips logging for routes that don't need it or don't require a secret
    if (isPostman || secretHeader !== "secret") {
      return res.json({ ipInfo: ipDetails });
    }
  } catch (err) {
    return res.status(500).json({
      ipInfo: {
        query: clientIp,
        message: 'Internal server error',
      },
      error: err,
    });
  }
  
  next();
}

module.exports = logRequests;