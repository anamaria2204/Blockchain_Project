import { ethers } from "hardhat";
import { ZombieOwnership } from "../../typechain-types";
import * as fs from "fs";
import * as path from "path";

function getDeployedAddress(): string {
  const filePath = path.join(__dirname, "../../deployed-address.json");
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (data.ZombieOwnership) return data.ZombieOwnership;
  }
  return "0x5FbDB2315678afecb367f032d93F642f64180aa3";
}

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS || getDeployedAddress();
  const zombieIdStr = process.env.ZOMBIE_ID;

  if (!zombieIdStr) {
    console.error("❌ Error: ZOMBIE_ID environment variable is required");
    console.log("\nUsage:");
    console.log("  $env:ZOMBIE_ID=1; npm run interact:getbounty");
    process.exit(1);
  }

  const zombieId = parseInt(zombieIdStr);
  console.log("🔍 Getting Bounty Info...\n");
  console.log("Contract address:", contractAddress);
  console.log("Zombie ID:", zombieId);

  const contract = await ethers.getContractAt("ZombieOwnership", contractAddress) as unknown as ZombieOwnership;

  const bounty = await contract.getBounty(zombieId);
  const placer = await contract.bountyPlacer(zombieId);

  console.log("\n💰 Bounty on zombie", zombieId, ":", ethers.formatEther(bounty), "ETH");

  if (bounty === 0n) {
    console.log("No active bounty on this zombie.");
    console.log("Place one with:");
    console.log('  $env:ZOMBIE_ID=' + zombieId + '; $env:BOUNTY_AMOUNT="0.1"; npm run interact:placebounty');
  } else {
    console.log("Placed by:", placer);
    console.log("Defeat this zombie in battle to claim the bounty!");
  }
}

main().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
