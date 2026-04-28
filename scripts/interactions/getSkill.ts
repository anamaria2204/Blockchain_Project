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

const SKILL_LABELS: Record<string, string> = { "0": "None", "1": "Firebreath", "2": "Shield", "3": "Poison" };

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS || getDeployedAddress();
  const zombieIdStr = process.env.ZOMBIE_ID;

  if (!zombieIdStr) {
    console.error("❌ Error: ZOMBIE_ID environment variable is required");
    console.log("\nUsage:");
    console.log("  $env:ZOMBIE_ID=0; npm run interact:getskill");
    process.exit(1);
  }

  const zombieId = parseInt(zombieIdStr);
  console.log("🔍 Getting Skill...\n");
  console.log("Contract address:", contractAddress);
  console.log("Zombie ID:", zombieId);

  const contract = await ethers.getContractAt("ZombieOwnership", contractAddress) as unknown as ZombieOwnership;

  const skill = await contract.getSkill(zombieId);
  const skillLabel = SKILL_LABELS[skill.toString()] || "Unknown";

  console.log("\n⚔️  Zombie", zombieId, "skill:", skillLabel);

  if (skill === 0n) {
    console.log("This zombie has no skill yet. Buy one with:");
    console.log('  $env:ZOMBIE_ID=' + zombieId + '; $env:SKILL="Firebreath"; npm run interact:buyskill');
  }
}

main().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
