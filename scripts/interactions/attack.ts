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
  const targetIdStr = process.env.TARGET_ID;
  const signerIndex = parseInt(process.env.SIGNER_INDEX || "0");

  if (!zombieIdStr || !targetIdStr) {
    console.error("❌ Error: ZOMBIE_ID and TARGET_ID environment variables are required");
    console.log("\nUsage:");
    console.log("  $env:ZOMBIE_ID=0; $env:TARGET_ID=1; npm run interact:attack");
    console.log("\nOptional: use a different signer account:");
    console.log("  $env:SIGNER_INDEX=1; $env:ZOMBIE_ID=1; $env:TARGET_ID=0; npm run interact:attack");
    process.exit(1);
  }

  const zombieId = parseInt(zombieIdStr);
  const targetId = parseInt(targetIdStr);

  const signers = await ethers.getSigners();
  const signer = signers[signerIndex];

  console.log("⚔️  Initiating Attack...\n");
  console.log("Contract address:", contractAddress);
  console.log("Attacker zombie ID:", zombieId);
  console.log("Target zombie ID:", targetId);
  console.log("Using account:", signer.address, signerIndex > 0 ? `(signer index ${signerIndex})` : "");

  const contract = await ethers.getContractAt("ZombieOwnership", contractAddress, signer) as unknown as ZombieOwnership;

  // Show pre-battle stats
  const attacker = await contract.zombies(zombieId);
  const target = await contract.zombies(targetId);
  const attackerSkill = await contract.getSkill(zombieId);
  const targetSkill = await contract.getSkill(targetId);
  const targetBounty = await contract.getBounty(targetId);

  console.log("\n📊 Pre-Battle Stats:");
  console.log("─".repeat(50));
  console.log(`🗡  Attacker: ${attacker.name} (ID: ${zombieId})`);
  console.log(`   Level: ${attacker.level} | Wins: ${attacker.winCount} | Losses: ${attacker.lossCount}`);
  console.log(`   Skill: ${SKILL_LABELS[attackerSkill.toString()]}`);
  console.log(`🛡  Defender: ${target.name} (ID: ${targetId})`);
  console.log(`   Level: ${target.level} | Wins: ${target.winCount} | Losses: ${target.lossCount}`);
  console.log(`   Skill: ${SKILL_LABELS[targetSkill.toString()]}`);
  if (targetBounty > 0n) {
    console.log(`   💰 Bounty: ${ethers.formatEther(targetBounty)} ETH (will be claimed if you win!)`);
  }
  console.log("─".repeat(50));

  console.log("\n⚔️  Attacking...");
  const tx = await contract.attack(zombieId, targetId);
  console.log("Transaction sent:", tx.hash);
  const receipt = await tx.wait();
  console.log("✅ Transaction confirmed!\n");

  // Show post-battle stats
  const attackerAfter = await contract.zombies(zombieId);
  const targetAfter = await contract.zombies(targetId);

  const won = attackerAfter.winCount > attacker.winCount;

  console.log(won ? "🎉 YOU WON!" : "💀 YOU LOST!");
  console.log("\n📊 Post-Battle Stats:");
  console.log("─".repeat(50));
  console.log(`🗡  ${attackerAfter.name}: Level ${attackerAfter.level} | Wins: ${attackerAfter.winCount} | Losses: ${attackerAfter.lossCount}`);
  console.log(`🛡  ${targetAfter.name}: Level ${targetAfter.level} | Wins: ${targetAfter.winCount} | Losses: ${targetAfter.lossCount}`);

  if (won && targetBounty > 0n) {
    console.log(`\n💰 Bounty of ${ethers.formatEther(targetBounty)} ETH has been claimed!`);
  }

  if (won) {
    const totalZombies = await contract.getZombiesByOwner(signer.address);
    console.log(`\n🧟 You now own ${totalZombies.length} zombie(s)! (a new zombie was spawned from the battle)`);
  }
}

main().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
