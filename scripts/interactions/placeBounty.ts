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
  const bountyAmountStr = process.env.BOUNTY_AMOUNT;

  if (!zombieIdStr || !bountyAmountStr) {
    console.error("❌ Error: ZOMBIE_ID and BOUNTY_AMOUNT environment variables are required");
    console.log("\nUsage:");
    console.log('  $env:ZOMBIE_ID=1; $env:BOUNTY_AMOUNT="0.1"; npm run interact:placebounty');
    process.exit(1);
  }

  const zombieId = parseInt(zombieIdStr);
  const bountyAmount = ethers.parseEther(bountyAmountStr);

  console.log("💰 Placing Bounty...\n");
  console.log("Contract address:", contractAddress);
  console.log("Target Zombie ID:", zombieId);
  console.log("Bounty amount:", bountyAmountStr, "ETH");

  const signers = await ethers.getSigners();
  const signerIndex = parseInt(process.env.SIGNER_INDEX || "0");
  const signer = signers[signerIndex];
  console.log("Using account:", signer.address, signerIndex > 0 ? `(signer index ${signerIndex})` : "");

  const contract = await ethers.getContractAt("ZombieOwnership", contractAddress, signer) as unknown as ZombieOwnership;

  const currentBounty = await contract.getBounty(zombieId);
  console.log("Current bounty on zombie:", ethers.formatEther(currentBounty), "ETH");

  const tx = await contract.placeBounty(zombieId, { value: bountyAmount });
  console.log("Transaction sent:", tx.hash);
  await tx.wait();

  const newBounty = await contract.getBounty(zombieId);
  console.log("\n✅ Bounty placed successfully!");
  console.log("Total bounty on zombie", zombieId, "is now:", ethers.formatEther(newBounty), "ETH");
}

main().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
