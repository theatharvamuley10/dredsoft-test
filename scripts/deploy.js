// hardhat/deploy.js
const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account", deployer.address);

  const Voting = await ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();
  await voting.waitForDeployment();

  console.log("Voting deployed to:", voting.target);

  // Copy artifact to backend/abi
  const artifactsPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "Voting.sol",
    "Voting.json"
  );
  const dest = path.join(__dirname, "..", "backend", "abi", "Voting.json");

  if (fs.existsSync(artifactsPath)) {
    fs.copyFileSync(artifactsPath, dest);
    console.log("Copied ABI to", dest);
  } else {
    console.warn("Artifact not found at", artifactsPath);
  }

  // Print env line to add to backend/.env
  console.log(
    `\nAdd to backend/.env:\nCONTRACT_ADDRESS=${voting.target}\nOWNER_ADDRESS=${deployer.address}\n`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
