import { run } from "hardhat";

/**
 * Verify the ZombieOwnership contract on Etherscan
 *
 * Usage:
 *   npx hardhat run scripts/verify.ts --network <network>
 *
 * Or verify manually:
 *   npx hardhat verify --network <network> <CONTRACT_ADDRESS>
 */

async function main() {
  // Replace with your deployed contract address
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!contractAddress) {
    console.error("Error: CONTRACT_ADDRESS environment variable not set");
    console.log("\nUsage:");
    console.log("  CONTRACT_ADDRESS=0x... npx hardhat run scripts/verify.ts --network <network>");
    console.log("\nOr verify manually:");
    console.log("  npx hardhat verify --network <network> <CONTRACT_ADDRESS>");
    process.exit(1);
  }

  console.log("Verifying ZombieOwnership contract...");
  console.log("Contract address:", contractAddress);

  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [], // ZombieOwnership constructor has no arguments
    });

    console.log("✓ Contract verified successfully!");
  } catch (error: any) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("✓ Contract already verified!");
    } else {
      console.error("✗ Verification failed:");
      console.error(error);
      process.exit(1);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
