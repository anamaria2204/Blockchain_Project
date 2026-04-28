// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ZombieBounty.sol";

contract ZombieAttack is ZombieBounty {
  uint256 randNonce = 0;
  uint256 attackVictoryProbability = 70;

  function randMod(uint256 _modulus) internal returns(uint256) {
    randNonce++;
    return uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, randNonce))) % _modulus;
  }

  function _getEffectiveWinProbability(uint256 _attackerId, uint256 _targetId) internal view returns (uint256) {
    uint256 prob = attackVictoryProbability;

    // Firebreath: attacker wins more easily (+10%)
    if (zombieSkill[_attackerId] == SkillType.Firebreath) {
      prob += 10;
    }

    // Shield: defender is harder to beat (enemy needs 80% instead of 70%)
    if (zombieSkill[_targetId] == SkillType.Shield) {
      if (prob >= 10) prob -= 10;
    }

    return prob;
  }

  function attack(uint256 _zombieId, uint256 _targetId) external onlyOwnerOf(_zombieId) {
    Zombie storage myZombie = zombies[_zombieId];
    require(_isReady(myZombie), "Zombie not ready to attack");
    Zombie storage enemyZombie = zombies[_targetId];

    uint256 effectiveProb = _getEffectiveWinProbability(_zombieId, _targetId);
    uint256 rand = randMod(100);

    if (rand <= effectiveProb) {
      // Attacker wins
      myZombie.winCount++;
      myZombie.level++;
      enemyZombie.lossCount++;
      feedAndMultiply(_zombieId, enemyZombie.dna, "zombie");
      // Claim bounty on defeated zombie
      _claimBounty(_targetId, msg.sender);
    } else {
      // Attacker loses
      myZombie.lossCount++;
      enemyZombie.winCount++;
      _triggerCooldown(myZombie);

      // Poison: even on loss, enemy zombie loses a level
      if (zombieSkill[_zombieId] == SkillType.Poison) {
        if (enemyZombie.level > 1) {
          enemyZombie.level--;
        }
      }
    }
  }
}
