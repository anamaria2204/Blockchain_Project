import { ethers } from "hardhat";
import { ZombieOwnership } from "../typechain-types";

/**
 * Example script to interact with the deployed ZombieOwnership contract
 *
 * Usage:
 *   CONTRACT_ADDRESS=0x... npx hardhat run scripts/interact.ts --network <network>
 */

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!contractAddress) {
    console.error("Error: CONTRACT_ADDRESS environment variable not set");
    console.log("\nUsage:");
    console.log("  CONTRACT_ADDRESS=0x... npx hardhat run scripts/interact.ts --network <network>");
    process.exit(1);
  }

  console.log("Connecting to ZombieOwnership contract...");
  console.log("Contract address:", contractAddress);

  const [owner] = await ethers.getSigners();
  console.log("Using account:", owner.address);

  // Connect to the deployed contract
  const zombieOwnership = await ethers.getContractAt(
    "ZombieOwnership",
    contractAddress
  ) as unknown as ZombieOwnership;

  console.log("\n" + "=".repeat(60));
  console.log("Contract Interaction Examples");
  console.log("=".repeat(60) + "\n");

  // 1. Check if owner already has a zombie
  const ownerBalance = await zombieOwnership.balanceOf(owner.address);
  console.log("1. Your zombie balance:", ownerBalance.toString());

  if (ownerBalance === 0n) {
    // 2. Create a random zombie
    console.log("\n2. Creating your first zombie...");
    const tx = await zombieOwnership.createRandomZombie("SuperZombie");
    console.log("   Transaction hash:", tx.hash);
    await tx.wait();
    console.log("   ✓ Zombie created!");

    // Get the zombie details
    const zombies = await zombieOwnership.getZombiesByOwner(owner.address);
    const zombieId = zombies[0];
    const zombie = await zombieOwnership.zombies(zombieId);

    console.log("\n   Zombie details:");
    console.log("   - ID:", zombieId.toString());
    console.log("   - Name:", zombie.name);
    console.log("   - DNA:", zombie.dna.toString());
    console.log("   - Level:", zombie.level.toString());
    console.log("   - Win Count:", zombie.winCount.toString());
    console.log("   - Loss Count:", zombie.lossCount.toString());
  } else {
    console.log("   You already have zombie(s)!");

    // Show all zombies
    const zombies = await zombieOwnership.getZombiesByOwner(owner.address);
    console.log("\n   Your zombies:");
    for (let i = 0; i < zombies.length; i++) {
      const zombieId = zombies[i];
      const zombie = await zombieOwnership.zombies(zombieId);
      console.log(`   ${i + 1}. ${zombie.name} (ID: ${zombieId}, Level: ${zombie.level}, DNA: ${zombie.dna})`);
    }
  }

  // 3. Check level up fee
  console.log("\n3. Level up fee:");
  // Note: We need to add a getter for levelUpFee or just show the default
  console.log("   Default: 0.001 ETH");

  // 4. Get contract owner
  const contractOwner = await zombieOwnership.owner();
  console.log("\n4. Contract owner:", contractOwner);
  console.log("   You are", owner.address === contractOwner ? "the owner ✓" : "NOT the owner");

  console.log("\n" + "=".repeat(60));
  console.log("Available functions:");
  console.log("=".repeat(60));
  console.log("• createRandomZombie(name) - Create your first zombie");
  console.log("• levelUp(zombieId) - Level up zombie (costs 0.001 ETH)");
  console.log("• changeName(zombieId, newName) - Change name (level 2+)");
  console.log("• changeDna(zombieId, newDna) - Change DNA (level 20+)");
  console.log("• attack(zombieId, targetId) - Attack another zombie");
  console.log("• transferFrom(from, to, zombieId) - Transfer zombie");
  console.log("• approve(to, zombieId) - Approve transfer");
  console.log("\nOwner-only functions:");
  console.log("• setLevelUpFee(fee) - Set level up fee");
  console.log("• withdraw() - Withdraw contract balance");
  console.log("• setKittyContractAddress(address) - Set CryptoKitties contract");
  console.log("=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
