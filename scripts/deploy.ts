import { ethers } from "hardhat";

async function main() {
  console.log("Starting CryptoZombies deployment...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy ZombieOwnership (main contract that includes all functionality)
  console.log("Deploying ZombieOwnership contract...");
  const ZombieOwnership = await ethers.getContractFactory("ZombieOwnership");
  const zombieOwnership = await ZombieOwnership.deploy();

  await zombieOwnership.waitForDeployment();
  const contractAddress = await zombieOwnership.getAddress();

  console.log("✓ ZombieOwnership deployed to:", contractAddress);
  console.log("\n" + "=".repeat(60));
  console.log("Deployment Summary");
  console.log("=".repeat(60));
  console.log("Contract:", "ZombieOwnership");
  console.log("Address:", contractAddress);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Deployer:", deployer.address);
  console.log("=".repeat(60) + "\n");

  // Optional: Set initial configuration
  console.log("Contract deployed successfully!");
  console.log("\nNext steps:");
  console.log("1. Verify contract (optional):");
  console.log(`   npx hardhat verify --network <network> ${contractAddress}`);
  console.log("\n2. Set CryptoKitties contract address (if needed):");
  console.log(`   await zombieOwnership.setKittyContractAddress("0x...")`);
  console.log("\n3. Interact with the contract:");
  console.log(`   - Create zombie: createRandomZombie("ZombieName")`);
  console.log(`   - Level up fee: setLevelUpFee(ethers.parseEther("0.001"))`);

  return contractAddress;
}

// Execute deployment
main()
  .then((address) => {
    console.log("\n✓ Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
