// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ZombieHelper.sol";

contract ZombieSkills is ZombieHelper {

  enum SkillType { None, Firebreath, Shield, Poison }

  uint256 public skillFee = 0.002 ether;

  mapping(uint256 => SkillType) public zombieSkill;

  event SkillAcquired(uint256 indexed zombieId, SkillType skill);

  modifier hasNoSkill(uint256 _zombieId) {
    require(zombieSkill[_zombieId] == SkillType.None, "Zombie already has a skill");
    _;
  }

  function setSkillFee(uint256 _fee) external onlyOwner {
    skillFee = _fee;
  }

  function buySkill(uint256 _zombieId, SkillType _skill) external payable onlyOwnerOf(_zombieId) hasNoSkill(_zombieId) {
    require(_skill != SkillType.None, "Invalid skill");
    require(msg.value == skillFee, "Incorrect ETH amount");
    zombieSkill[_zombieId] = _skill;
    emit SkillAcquired(_zombieId, _skill);
  }

  function getSkill(uint256 _zombieId) external view returns (SkillType) {
    return zombieSkill[_zombieId];
  }

  function withdrawSkillFees() external onlyOwner {
    address payable _owner = payable(owner());
    (bool success, ) = _owner.call{value: address(this).balance}("");
    require(success, "Transfer failed");
  }
}
