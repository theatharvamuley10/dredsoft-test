require("dotenv").config();

const config = {
  // Network
  rpcUrl: process.env.RPC_URL || "http://127.0.0.1:8545",
  networkId: process.env.NETWORK_ID || "31337",

  // Contract
  contractAddress: process.env.CONTRACT_ADDRESS,
  ownerAddress: process.env.OWNER_ADDRESS,
  ownerPrivateKey: process.env.OWNER_PRIVATE_KEY,

  // Server
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",

  // Security
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  rateLimitMaxRequests:
    parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,

  // Validation
  isProduction: () => config.nodeEnv === "production",
  isDevelopment: () => config.nodeEnv === "development",
};

// Validate critical config
const validateConfig = () => {
  const required = ["contractAddress", "ownerAddress", "ownerPrivateKey"];
  const missing = required.filter((key) => !config[key]);

  if (missing.length > 0) {
    console.warn(`⚠️  Missing required configuration: ${missing.join(", ")}`);
    console.warn("Please update backend/.env with deployment details");
  }
};

validateConfig();

module.exports = config;
