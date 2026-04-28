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
  return "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // fallback
}

/**
 * Script pentru crearea unui zombie nou
 *
 * Usage:
 *   CONTRACT_ADDRESS=0x... ZOMBIE_NAME="NumeZombie" npx hardhat run scripts/interactions/createZombie.ts --network localhost
 *
 * Sau folosește adresa default:
 *   ZOMBIE_NAME="NumeZombie" npx hardhat run scripts/interactions/createZombie.ts --network localhost
 */

async function main() {
  // Adresa contractului (default sau din environment variable)
  const contractAddress = process.env.CONTRACT_ADDRESS || getDeployedAddress();
  const zombieName = process.env.ZOMBIE_NAME;

  if (!zombieName) {
    console.error("❌ Error: ZOMBIE_NAME environment variable not set");
    console.log("\nUsage:");
    console.log('  ZOMBIE_NAME="NumeZombie" npx hardhat run scripts/interactions/createZombie.ts --network localhost');
    process.exit(1);
  }

  console.log("🧟 Creating Zombie...\n");
  console.log("Contract address:", contractAddress);
  console.log("Zombie name:", zombieName);

  const signers = await ethers.getSigners();
  const signerIndex = parseInt(process.env.SIGNER_INDEX || "0");
  const owner = signers[signerIndex];
  console.log("Using account:", owner.address, signerIndex > 0 ? `(signer index ${signerIndex})` : "");

  // Conectează la contract
  const contract = await ethers.getContractAt(
    "ZombieOwnership",
    contractAddress,
    owner
  ) as unknown as ZombieOwnership;

  // Verifică dacă user-ul are deja un zombie
  const balance = await contract.balanceOf(owner.address);
  if (balance > 0n) {
    console.log("\n⚠️  You already have", balance.toString(), "zombie(s)!");
    console.log("Each address can only create one zombie initially.");

    // Afișează zombies existenți
    const zombies = await contract.getZombiesByOwner(owner.address);
    console.log("\nYour existing zombies:");
    for (let i = 0; i < zombies.length; i++) {
      const zombieId = zombies[i];
      const zombie = await contract.zombies(zombieId);
      console.log(`  ${i + 1}. ${zombie.name} (ID: ${zombieId}, Level: ${zombie.level}, DNA: ${zombie.dna})`);
    }
    return;
  }

  // Creează zombie-ul
  console.log("\n⏳ Creating zombie...");
  const tx = await contract.createRandomZombie(zombieName);
  console.log("Transaction hash:", tx.hash);

  await tx.wait();
  console.log("✅ Transaction confirmed!");

  // Obține detaliile zombie-ului creat
  const zombies = await contract.getZombiesByOwner(owner.address);
  const zombieId = zombies[0];
  const zombie = await contract.zombies(zombieId);

  console.log("\n🎉 Zombie created successfully!\n");
  console.log("Zombie Details:");
  console.log("  ID:", zombieId.toString());
  console.log("  Name:", zombie.name);
  console.log("  DNA:", zombie.dna.toString());
  console.log("  Level:", zombie.level.toString());
  console.log("  Win Count:", zombie.winCount.toString());
  console.log("  Loss Count:", zombie.lossCount.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });
