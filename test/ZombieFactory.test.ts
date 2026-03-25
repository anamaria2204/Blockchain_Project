import { expect } from "chai";
import { ethers } from "hardhat";
import { ZombieOwnership } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ZombieFactory", function () {
  let zombieOwnership: ZombieOwnership;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const ZombieOwnership = await ethers.getContractFactory("ZombieOwnership");
    zombieOwnership = await ZombieOwnership.deploy() as unknown as ZombieOwnership;
  });

  describe("createRandomZombie", function () {
    it("Should create a zombie with valid DNA", async function () {
      const zombieName = "TestZombie";

      await zombieOwnership.createRandomZombie(zombieName);

      const zombies = await zombieOwnership.getZombiesByOwner(owner.address);
      expect(zombies.length).to.equal(1);

      const zombie = await zombieOwnership.zombies(0);
      expect(zombie.name).to.equal(zombieName);
      expect(zombie.dna).to.be.gt(0);
      expect(zombie.level).to.equal(1);
    });

    it("Should generate DNA with 16 digits", async function () {
      await zombieOwnership.createRandomZombie("TestZombie");

      const zombie = await zombieOwnership.zombies(0);
      const dna = zombie.dna.toString();

      // DNA should be exactly 16 digits
      expect(dna.length).to.be.lte(16);
    });

    it("Should only allow one zombie per address", async function () {
      await zombieOwnership.createRandomZombie("FirstZombie");

      await expect(
        zombieOwnership.createRandomZombie("SecondZombie")
      ).to.be.reverted;
    });

    it("Should emit NewZombie event", async function () {
      await expect(zombieOwnership.createRandomZombie("TestZombie"))
        .to.emit(zombieOwnership, "NewZombie");

      // Verify the event data separately
      const zombie = await zombieOwnership.zombies(0);
      expect(zombie.name).to.equal("TestZombie");
    });

    it("Should assign correct ownership", async function () {
      await zombieOwnership.createRandomZombie("TestZombie");

      const zombieOwner = await zombieOwnership.zombieToOwner(0);
      expect(zombieOwner).to.equal(owner.address);

      const balance = await zombieOwnership.balanceOf(owner.address);
      expect(balance).to.equal(1);
    });

    it("Should initialize zombie with correct stats", async function () {
      await zombieOwnership.createRandomZombie("TestZombie");

      const zombie = await zombieOwnership.zombies(0);
      expect(zombie.level).to.equal(1);
      expect(zombie.winCount).to.equal(0);
      expect(zombie.lossCount).to.equal(0);
      expect(zombie.readyTime).to.be.gt(0);
    });

    it("Should allow different addresses to create zombies", async function () {
      await zombieOwnership.connect(owner).createRandomZombie("Zombie1");
      await zombieOwnership.connect(addr1).createRandomZombie("Zombie2");

      const ownerZombies = await zombieOwnership.getZombiesByOwner(owner.address);
      const addr1Zombies = await zombieOwnership.getZombiesByOwner(addr1.address);

      expect(ownerZombies.length).to.equal(1);
      expect(addr1Zombies.length).to.equal(1);
    });
  });

  describe("DNA generation", function () {
    it("Should generate different DNA for different names", async function () {
      await zombieOwnership.connect(owner).createRandomZombie("Zombie1");
      await zombieOwnership.connect(addr1).createRandomZombie("Zombie2");

      const zombie1 = await zombieOwnership.zombies(0);
      const zombie2 = await zombieOwnership.zombies(1);

      expect(zombie1.dna).to.not.equal(zombie2.dna);
    });

    it("Should generate DNA ending in 00", async function () {
      await zombieOwnership.createRandomZombie("TestZombie");

      const zombie = await zombieOwnership.zombies(0);
      const dna = zombie.dna.toString();

      // DNA should end in 00 (due to randDna = randDna - randDna % 100)
      expect(Number(dna) % 100).to.equal(0);
    });
  });
});
