import { ethers } from "hardhat";
import { ZombieOwnership } from "../typechain-types";

/**
 * Setup script to configure the deployed contract with initial settings
 *
 * Usage:
 *   CONTRACT_ADDRESS=0x... npx hardhat run scripts/setup.ts --network <network>
 */

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!contractAddress) {
    console.error("Error: CONTRACT_ADDRESS environment variable not set");
    console.log("\nUsage:");
    console.log("  CONTRACT_ADDRESS=0x... npx hardhat run scripts/setup.ts --network <network>");
    process.exit(1);
  }

  console.log("Setting up ZombieOwnership contract...");
  console.log("Contract address:", contractAddress);

  const [owner] = await ethers.getSigners();
  console.log("Using account:", owner.address);

  // Connect to the deployed contract
  const zombieOwnership = await ethers.getContractAt(
    "ZombieOwnership",
    contractAddress
  ) as unknown as ZombieOwnership;

  console.log("\n" + "=".repeat(60));
  console.log("Initial Configuration");
  console.log("=".repeat(60) + "\n");

  // 1. Verify contract owner
  const contractOwner = await zombieOwnership.owner();
  console.log("1. Contract owner:", contractOwner);

  if (contractOwner.toLowerCase() !== owner.address.toLowerCase()) {
    console.error("   Error: You are not the contract owner!");
    console.error("   Contract owner:", contractOwner);
    console.error("   Your address:", owner.address);
    process.exit(1);
  }
  console.log("   ✓ Ownership verified");

  // 2. Set level up fee (optional, default is 0.001 ETH)
  const customLevelUpFee = process.env.LEVEL_UP_FEE;
  if (customLevelUpFee) {
    console.log("\n2. Setting custom level up fee...");
    const feeInWei = ethers.parseEther(customLevelUpFee);
    const tx = await zombieOwnership.setLevelUpFee(feeInWei);
    await tx.wait();
    console.log("   ✓ Level up fee set to:", customLevelUpFee, "ETH");
  } else {
    console.log("\n2. Level up fee: Using default (0.001 ETH)");
    console.log("   To set custom fee: LEVEL_UP_FEE=0.002 npm run setup");
  }

  // 3. Set CryptoKitties contract address (optional)
  const kittyContractAddress = process.env.KITTY_CONTRACT_ADDRESS;
  if (kittyContractAddress) {
    console.log("\n3. Setting CryptoKitties contract address...");
    const tx = await zombieOwnership.setKittyContractAddress(kittyContractAddress);
    await tx.wait();
    console.log("   ✓ CryptoKitties contract set to:", kittyContractAddress);
  } else {
    console.log("\n3. CryptoKitties contract: Not configured");
    console.log("   To set: KITTY_CONTRACT_ADDRESS=0x... npm run setup");
    console.log("   Real CryptoKitties address (Mainnet): 0x06012c8cf97BEaD5deAe237070F9587f8E7A266d");
  }

  console.log("\n" + "=".repeat(60));
  console.log("Setup Complete!");
  console.log("=".repeat(60));
  console.log("\nYour contract is ready to use!");
  console.log("\nTo interact with the contract:");
  console.log(`  CONTRACT_ADDRESS=${contractAddress} npm run interact`);
  console.log("\n" + "=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
