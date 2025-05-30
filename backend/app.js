const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const aiRoutes = require("./Routes/aiRoutes");
const authRoutes = require("./Routes/authRoutes");
const customerRoutes = require("./Routes/customerRoutes");
const ticketRoutes = require("./Routes/ticketRoutes");

const {
  releaseTimedOutReservations,
} = require("./Controllers/ticketController");

const app = express();

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true, // Allow cookies and auth headers
};
app.use(cors(corsOptions));

app.use(aiRoutes);
app.use(authRoutes);
app.use(customerRoutes);
app.use(ticketRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Run cleanup every minute to release orphaned tickets
setInterval(async () => {
  try {
    const released = await releaseTimedOutReservations();
    if (released > 0) {
      console.log(`Released ${released} abandoned ticket reservations`);
    }
  } catch (error) {
    console.error("Failed to release timed-out reservations:", error);
  }
}, 60000);
