import { expect } from "chai";
import { ethers } from "hardhat";
import { ZombieOwnership } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ZombieOwnership", function () {
  let zombieOwnership: ZombieOwnership;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const ZombieOwnership = await ethers.getContractFactory("ZombieOwnership");
    zombieOwnership = await ZombieOwnership.deploy() as unknown as ZombieOwnership;

    // Create zombies
    await zombieOwnership.connect(owner).createRandomZombie("OwnerZombie");
    await zombieOwnership.connect(addr1).createRandomZombie("Addr1Zombie");
  });

  describe("balanceOf", function () {
    it("Should return correct balance for addresses", async function () {
      const ownerBalance = await zombieOwnership.balanceOf(owner.address);
      const addr1Balance = await zombieOwnership.balanceOf(addr1.address);
      const addr2Balance = await zombieOwnership.balanceOf(addr2.address);

      expect(ownerBalance).to.equal(1);
      expect(addr1Balance).to.equal(1);
      expect(addr2Balance).to.equal(0);
    });

    it("Should update balance after transfer", async function () {
      await zombieOwnership.transferFrom(owner.address, addr2.address, 0);

      const ownerBalance = await zombieOwnership.balanceOf(owner.address);
      const addr2Balance = await zombieOwnership.balanceOf(addr2.address);

      expect(ownerBalance).to.equal(0);
      expect(addr2Balance).to.equal(1);
    });
  });

  describe("ownerOf", function () {
    it("Should return correct owner of zombie", async function () {
      const zombie0Owner = await zombieOwnership.ownerOf(0);
      const zombie1Owner = await zombieOwnership.ownerOf(1);

      expect(zombie0Owner).to.equal(owner.address);
      expect(zombie1Owner).to.equal(addr1.address);
    });

    it("Should update owner after transfer", async function () {
      await zombieOwnership.transferFrom(owner.address, addr2.address, 0);

      const zombie0Owner = await zombieOwnership.ownerOf(0);
      expect(zombie0Owner).to.equal(addr2.address);
    });
  });

  describe("transferFrom", function () {
    it("Should allow owner to transfer their zombie", async function () {
      await zombieOwnership.transferFrom(owner.address, addr2.address, 0);

      const newOwner = await zombieOwnership.ownerOf(0);
      expect(newOwner).to.equal(addr2.address);
    });

    it("Should emit Transfer event", async function () {
      await expect(zombieOwnership.transferFrom(owner.address, addr2.address, 0))
        .to.emit(zombieOwnership, "Transfer")
        .withArgs(owner.address, addr2.address, 0);
    });

    it("Should not allow non-owner to transfer zombie", async function () {
      await expect(
        zombieOwnership.connect(addr1).transferFrom(owner.address, addr2.address, 0)
      ).to.be.reverted;
    });

    it("Should allow approved address to transfer", async function () {
      // Owner approves addr1 to transfer zombie 0
      await zombieOwnership.approve(addr1.address, 0);

      // addr1 can now transfer the zombie
      await zombieOwnership.connect(addr1).transferFrom(owner.address, addr2.address, 0);

      const newOwner = await zombieOwnership.ownerOf(0);
      expect(newOwner).to.equal(addr2.address);
    });

    it("Should update balances correctly on transfer", async function () {
      const ownerBalanceBefore = await zombieOwnership.balanceOf(owner.address);
      const addr2BalanceBefore = await zombieOwnership.balanceOf(addr2.address);

      await zombieOwnership.transferFrom(owner.address, addr2.address, 0);

      const ownerBalanceAfter = await zombieOwnership.balanceOf(owner.address);
      const addr2BalanceAfter = await zombieOwnership.balanceOf(addr2.address);

      expect(ownerBalanceAfter).to.equal(ownerBalanceBefore - 1n);
      expect(addr2BalanceAfter).to.equal(addr2BalanceBefore + 1n);
    });
  });

  describe("approve", function () {
    it("Should allow owner to approve address for zombie", async function () {
      await zombieOwnership.approve(addr1.address, 0);

      // Verify approval by trying to transfer
      await zombieOwnership.connect(addr1).transferFrom(owner.address, addr2.address, 0);

      const newOwner = await zombieOwnership.ownerOf(0);
      expect(newOwner).to.equal(addr2.address);
    });

    it("Should emit Approval event", async function () {
      await expect(zombieOwnership.approve(addr1.address, 0))
        .to.emit(zombieOwnership, "Approval")
        .withArgs(owner.address, addr1.address, 0);
    });

    it("Should not allow non-owner to approve", async function () {
      await expect(
        zombieOwnership.connect(addr1).approve(addr2.address, 0)
      ).to.be.reverted;
    });

    it("Should allow changing approval to different address", async function () {
      await zombieOwnership.approve(addr1.address, 0);
      await zombieOwnership.approve(addr2.address, 0);

      // Only addr2 should be able to transfer now
      await expect(
        zombieOwnership.connect(addr1).transferFrom(owner.address, addr1.address, 0)
      ).to.be.reverted;

      await zombieOwnership.connect(addr2).transferFrom(owner.address, addr2.address, 0);

      const newOwner = await zombieOwnership.ownerOf(0);
      expect(newOwner).to.equal(addr2.address);
    });
  });

  describe("Integration tests", function () {
    it("Should handle complete ownership flow", async function () {
      // 1. Check initial state
      expect(await zombieOwnership.ownerOf(0)).to.equal(owner.address);
      expect(await zombieOwnership.balanceOf(owner.address)).to.equal(1);

      // 2. Approve addr1
      await zombieOwnership.approve(addr1.address, 0);

      // 3. addr1 transfers to addr2
      await zombieOwnership.connect(addr1).transferFrom(owner.address, addr2.address, 0);

      // 4. Verify new state
      expect(await zombieOwnership.ownerOf(0)).to.equal(addr2.address);
      expect(await zombieOwnership.balanceOf(owner.address)).to.equal(0);
      expect(await zombieOwnership.balanceOf(addr2.address)).to.equal(1);

      // 5. addr2 can now transfer directly (as owner)
      await zombieOwnership.connect(addr2).transferFrom(addr2.address, owner.address, 0);

      // 6. Verify final state
      expect(await zombieOwnership.ownerOf(0)).to.equal(owner.address);
      expect(await zombieOwnership.balanceOf(owner.address)).to.equal(1);
      expect(await zombieOwnership.balanceOf(addr2.address)).to.equal(0);
    });

    it("Should maintain correct zombie count across transfers", async function () {
      // Create more zombies
      await zombieOwnership.connect(addr2).createRandomZombie("Addr2Zombie");

      const totalZombies = 3;

      let totalBalance = 0n;
      totalBalance += await zombieOwnership.balanceOf(owner.address);
      totalBalance += await zombieOwnership.balanceOf(addr1.address);
      totalBalance += await zombieOwnership.balanceOf(addr2.address);

      expect(totalBalance).to.equal(totalZombies);

      // Transfer some zombies
      await zombieOwnership.transferFrom(owner.address, addr1.address, 0);

      totalBalance = 0n;
      totalBalance += await zombieOwnership.balanceOf(owner.address);
      totalBalance += await zombieOwnership.balanceOf(addr1.address);
      totalBalance += await zombieOwnership.balanceOf(addr2.address);

      expect(totalBalance).to.equal(totalZombies);
    });
  });
});
