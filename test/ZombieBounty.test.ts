import { expect } from "chai";
import { ethers } from "hardhat";
import { ZombieOwnership } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ZombieBounty", function () {
  let contract: ZombieOwnership;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ZombieOwnership");
    contract = await Factory.deploy() as unknown as ZombieOwnership;

    // owner creates zombie (id=0), addr1 creates zombie (id=1)
    await contract.createRandomZombie("OwnerZombie");
    await contract.connect(addr1).createRandomZombie("Addr1Zombie");
  });

  describe("placeBounty", function () {
    it("Should allow placing a bounty on an enemy zombie", async function () {
      await contract.connect(addr1).placeBounty(0, { value: ethers.parseEther("0.1") });
      const bounty = await contract.getBounty(0);
      expect(bounty).to.equal(ethers.parseEther("0.1"));
    });

    it("Should allow multiple players to stack bounties", async function () {
      await contract.connect(addr1).placeBounty(0, { value: ethers.parseEther("0.1") });
      await contract.connect(addr2).placeBounty(0, { value: ethers.parseEther("0.2") });
      const bounty = await contract.getBounty(0);
      expect(bounty).to.equal(ethers.parseEther("0.3"));
    });

    it("Should revert if placing bounty with 0 ETH", async function () {
      await expect(
        contract.connect(addr1).placeBounty(0, { value: 0 })
      ).to.be.revertedWith("Bounty must be greater than 0");
    });

    it("Should revert if placing bounty on own zombie", async function () {
      await expect(
        contract.placeBounty(0, { value: ethers.parseEther("0.1") })
      ).to.be.revertedWith("Cannot place bounty on your own zombie");
    });

    it("Should revert if zombie does not exist", async function () {
      await expect(
        contract.connect(addr1).placeBounty(999, { value: ethers.parseEther("0.1") })
      ).to.be.revertedWith("Zombie does not exist");
    });

    it("Should emit BountyPlaced event", async function () {
      await expect(
        contract.connect(addr1).placeBounty(0, { value: ethers.parseEther("0.1") })
      )
        .to.emit(contract, "BountyPlaced")
        .withArgs(0, addr1.address, ethers.parseEther("0.1"));
    });
  });

  describe("removeBounty", function () {
    it("Should revert if lock duration has not passed", async function () {
      await contract.connect(addr1).placeBounty(0, { value: ethers.parseEther("0.1") });
      await expect(
        contract.connect(addr1).removeBounty(0)
      ).to.be.revertedWith("Bounty is still locked");
    });

    it("Should allow removal after lock duration", async function () {
      await contract.connect(addr1).placeBounty(0, { value: ethers.parseEther("0.1") });

      // Fast-forward 1 day
      await ethers.provider.send("evm_increaseTime", [86401]);
      await ethers.provider.send("evm_mine", []);

      await contract.connect(addr1).removeBounty(0);
      const bounty = await contract.getBounty(0);
      expect(bounty).to.equal(0);
    });

    it("Should revert if caller is not the bounty placer", async function () {
      await contract.connect(addr1).placeBounty(0, { value: ethers.parseEther("0.1") });

      await ethers.provider.send("evm_increaseTime", [86401]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        contract.connect(addr2).removeBounty(0)
      ).to.be.revertedWith("Not the bounty placer");
    });
  });

  describe("getBounty", function () {
    it("Should return 0 if no bounty is placed", async function () {
      const bounty = await contract.getBounty(0);
      expect(bounty).to.equal(0);
    });
  });
});
