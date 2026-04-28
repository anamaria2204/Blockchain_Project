import { expect } from "chai";
import { ethers } from "hardhat";
import { ZombieOwnership } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ZombieSkills", function () {
  let contract: ZombieOwnership;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;

  const SKILL_FEE = ethers.parseEther("0.002");
  const SkillType = { None: 0, Firebreath: 1, Shield: 2, Poison: 3 };

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ZombieOwnership");
    contract = await Factory.deploy() as unknown as ZombieOwnership;

    // Create a zombie for owner
    await contract.createRandomZombie("SkillZombie");
  });

  describe("buySkill", function () {
    it("Should allow buying Firebreath with correct ETH", async function () {
      await contract.buySkill(0, SkillType.Firebreath, { value: SKILL_FEE });
      const skill = await contract.getSkill(0);
      expect(skill).to.equal(SkillType.Firebreath);
    });

    it("Should allow buying Shield with correct ETH", async function () {
      await contract.buySkill(0, SkillType.Shield, { value: SKILL_FEE });
      const skill = await contract.getSkill(0);
      expect(skill).to.equal(SkillType.Shield);
    });

    it("Should allow buying Poison with correct ETH", async function () {
      await contract.buySkill(0, SkillType.Poison, { value: SKILL_FEE });
      const skill = await contract.getSkill(0);
      expect(skill).to.equal(SkillType.Poison);
    });

    it("Should revert if incorrect ETH amount sent", async function () {
      await expect(
        contract.buySkill(0, SkillType.Firebreath, { value: ethers.parseEther("0.001") })
      ).to.be.revertedWith("Incorrect ETH amount");
    });

    it("Should revert if zombie already has a skill", async function () {
      await contract.buySkill(0, SkillType.Firebreath, { value: SKILL_FEE });
      await expect(
        contract.buySkill(0, SkillType.Poison, { value: SKILL_FEE })
      ).to.be.revertedWith("Zombie already has a skill");
    });

    it("Should revert if caller is not the zombie owner", async function () {
      await expect(
        contract.connect(addr1).buySkill(0, SkillType.Shield, { value: SKILL_FEE })
      ).to.be.reverted;
    });

    it("Should revert if skill is None", async function () {
      await expect(
        contract.buySkill(0, SkillType.None, { value: SKILL_FEE })
      ).to.be.revertedWith("Invalid skill");
    });
  });

  describe("setSkillFee", function () {
    it("Should allow owner to change skill fee", async function () {
      const newFee = ethers.parseEther("0.005");
      await contract.setSkillFee(newFee);
      expect(await contract.skillFee()).to.equal(newFee);
    });

    it("Should revert if non-owner tries to change fee", async function () {
      await expect(
        contract.connect(addr1).setSkillFee(ethers.parseEther("0.005"))
      ).to.be.reverted;
    });
  });

  describe("getSkill", function () {
    it("Should return None for a zombie with no skill", async function () {
      const skill = await contract.getSkill(0);
      expect(skill).to.equal(SkillType.None);
    });
  });

  describe("SkillAcquired event", function () {
    it("Should emit SkillAcquired event on skill purchase", async function () {
      await expect(contract.buySkill(0, SkillType.Firebreath, { value: SKILL_FEE }))
        .to.emit(contract, "SkillAcquired")
        .withArgs(0, SkillType.Firebreath);
    });
  });
});
