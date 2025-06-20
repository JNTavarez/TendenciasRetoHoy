// Script to deploy VotingToken and VotingSystem_WithToken contracts
const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment of VotingToken and VotingSystem_WithToken contracts...");

  // 1. Get contract factories
  const VotingToken = await ethers.getContractFactory("contracts/VotingToken.sol:VotingToken");
  const VotingSystem_WithToken = await ethers.getContractFactory("contracts/VotingSystem_WithToken.sol:VotingSystem_WithToken");

  // 2. Deploy VotingToken
  console.log("Deploying VotingToken...");
  const votingToken = await VotingToken.deploy();
  await votingToken.deployed();
  console.log("VotingToken contract deployed to:", votingToken.address);

  // 3. Deploy VotingSystem_WithToken
  console.log("Deploying VotingSystem_WithToken...");
  const votingSystem = await VotingSystem_WithToken.deploy(votingToken.address);
  await votingSystem.deployed();
  console.log("VotingSystem_WithToken contract deployed to:", votingSystem.address);

  // 4. Save contract addresses to a file
  const deploymentInfo = {
    votingSystemAddress: votingSystem.address,
    votingTokenAddress: votingToken.address,
    deploymentTime: new Date().toISOString(),
    network: network.name,
    deployer: (await ethers.getSigners())[0].address
  };
  const deploymentPath = path.join(__dirname, "../deployment-info.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Deployment information saved to ${deploymentPath}`);

  // 5. Update the .env file with contract addresses
  try {
    const envPath = path.join(__dirname, "../client/.env");
    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf8");
    }

    const lines = envContent.split('\n');
    const newLines = [];

    const variablesToUpdate = {
        'REACT_APP_CONTRACT_ADDRESS': votingSystem.address,
        'REACT_APP_TOKEN_ADDRESS': votingToken.address,
        'REACT_APP_VOTING_ADDRESS': votingSystem.address // Assuming this is the main contract address
    };

    const existingKeys = new Set();
    
    // Update or keep existing lines
    for (const line of lines) {
        if (line.trim() === '') continue;
        const [key] = line.split('=');
        if (variablesToUpdate[key]) {
            newLines.push(`${key}=${variablesToUpdate[key]}`);
            existingKeys.add(key);
        } else {
            newLines.push(line);
        }
    }

    // Add new variables if they don't exist in the file
    for (const key in variablesToUpdate) {
        if (!existingKeys.has(key)) {
            newLines.push(`${key}=${variablesToUpdate[key]}`);
        }
    }

    fs.writeFileSync(envPath, newLines.join('\n'));
    console.log(".env file updated with new contract addresses.");

  } catch (error) {
    console.error("Failed to update .env file:", error);
  }

  console.log("Deployment completed successfully!");
}

// Execute the deployment function
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  });
