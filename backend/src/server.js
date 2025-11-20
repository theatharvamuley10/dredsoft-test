const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const config = require("./config");
const logger = require("./middleware/logger");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const votingRoutes = require("./routes/votingRoutes");
const web3Service = require("./services/web3Service");

const app = express();

// -----------------------------------------------------------------------
// Security & Middleware
// -----------------------------------------------------------------------
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// -----------------------------------------------------------------------
// Health Check
// -----------------------------------------------------------------------
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Voting API is running",
    timestamp: new Date().toISOString(),
    network: config.rpcUrl,
    contract: config.contractAddress,
  });
});

// -----------------------------------------------------------------------
// API Routes
// -----------------------------------------------------------------------
app.use("/api", votingRoutes);

// -----------------------------------------------------------------------
// Error Handling
// -----------------------------------------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

// -----------------------------------------------------------------------
// Initialize and Start Server
// -----------------------------------------------------------------------
const startServer = async () => {
  try {
    console.log("🚀 Initializing Voting API Server...\n");

    // Initialize Web3 connection
    await web3Service.initialize();

    // Start Express server
    app.listen(config.port, () => {
      console.log("\n✓ Server started successfully");
      console.log(`✓ Environment: ${config.nodeEnv}`);
      console.log(`✓ Port: ${config.port}`);
      console.log(`✓ Health check: http://localhost:${config.port}/health`);
      console.log(`✓ API base: http://localhost:${config.port}/api\n`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
