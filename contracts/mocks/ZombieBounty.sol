// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ZombieSkills.sol";

contract ZombieBounty is ZombieSkills {

  mapping(uint256 => uint256) public zombieBounty;
  mapping(uint256 => address) public bountyPlacer;
  mapping(uint256 => uint256) public bountyPlacedAt;

  uint256 public bountyLockDuration = 1 days;

  event BountyPlaced(uint256 indexed zombieId, address indexed placer, uint256 amount);
  event BountyClaimed(uint256 indexed zombieId, address indexed claimer, uint256 amount);
  event BountyRemoved(uint256 indexed zombieId, address indexed placer, uint256 amount);

  function placeBounty(uint256 _zombieId) external payable {
    require(msg.value > 0, "Bounty must be greater than 0");
    require(_zombieId < zombies.length, "Zombie does not exist");
    require(zombieToOwner[_zombieId] != msg.sender, "Cannot place bounty on your own zombie");

    if (zombieBounty[_zombieId] == 0) {
      bountyPlacer[_zombieId] = msg.sender;
      bountyPlacedAt[_zombieId] = block.timestamp;
    }

    zombieBounty[_zombieId] += msg.value;
    emit BountyPlaced(_zombieId, msg.sender, msg.value);
  }

  function removeBounty(uint256 _zombieId) external {
    require(bountyPlacer[_zombieId] == msg.sender, "Not the bounty placer");
    require(block.timestamp >= bountyPlacedAt[_zombieId] + bountyLockDuration, "Bounty is still locked");
    require(zombieBounty[_zombieId] > 0, "No bounty to remove");

    uint256 amount = zombieBounty[_zombieId];
    zombieBounty[_zombieId] = 0;
    bountyPlacer[_zombieId] = address(0);

    (bool success, ) = payable(msg.sender).call{value: amount}("");
    require(success, "Transfer failed");
    emit BountyRemoved(_zombieId, msg.sender, amount);
  }

  function _claimBounty(uint256 _defeatedZombieId, address _winner) internal {
    uint256 amount = zombieBounty[_defeatedZombieId];
    if (amount > 0) {
      zombieBounty[_defeatedZombieId] = 0;
      bountyPlacer[_defeatedZombieId] = address(0);
      (bool success, ) = payable(_winner).call{value: amount}("");
      require(success, "Bounty transfer failed");
      emit BountyClaimed(_defeatedZombieId, _winner, amount);
    }
  }

  function getBounty(uint256 _zombieId) external view returns (uint256) {
    return zombieBounty[_zombieId];
  }
}
