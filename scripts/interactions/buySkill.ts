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

const SKILL_NAMES: Record<string, number> = {
  firebreath: 1,
  shield: 2,
  poison: 3,
};

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS || getDeployedAddress();
  const zombieIdStr = process.env.ZOMBIE_ID;
  const skillName = process.env.SKILL?.toLowerCase();

  if (!zombieIdStr || !skillName) {
    console.error("❌ Error: ZOMBIE_ID and SKILL environment variables are required");
    console.log("\nUsage:");
    console.log('  $env:ZOMBIE_ID=0; $env:SKILL="Firebreath"; npm run interact:buyskill');
    console.log("\nAvailable skills: Firebreath, Shield, Poison");
    process.exit(1);
  }

  const skillValue = SKILL_NAMES[skillName];
  if (!skillValue) {
    console.error(`❌ Invalid skill "${skillName}". Choose from: Firebreath, Shield, Poison`);
    process.exit(1);
  }

  const zombieId = parseInt(zombieIdStr);
  console.log("⚔️  Buying Skill...\n");
  console.log("Contract address:", contractAddress);
  console.log("Zombie ID:", zombieId);
  console.log("Skill:", skillName.charAt(0).toUpperCase() + skillName.slice(1));

  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);

  const contract = await ethers.getContractAt("ZombieOwnership", contractAddress) as unknown as ZombieOwnership;

  const skillFee = await contract.skillFee();
  console.log("Skill fee:", ethers.formatEther(skillFee), "ETH\n");

  const currentSkill = await contract.getSkill(zombieId);
  if (currentSkill !== 0n) {
    console.log("⚠️  This zombie already has a skill (skill type:", currentSkill.toString(), ")");
    process.exit(1);
  }

  const tx = await contract.buySkill(zombieId, skillValue, { value: skillFee });
  console.log("Transaction sent:", tx.hash);
  await tx.wait();

  console.log("\n✅ Skill acquired successfully!");
  console.log("Zombie", zombieId, "now has skill:", skillName.charAt(0).toUpperCase() + skillName.slice(1));
}

main().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
