// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MockCryptoKitties {
  function getKitty(uint256 _id) external pure returns (
    bool isGestating,
    bool isReady,
    uint256 cooldownIndex,
    uint256 nextActionAt,
    uint256 siringWithId,
    uint256 birthTime,
    uint256 matronId,
    uint256 sireId,
    uint256 generation,
    uint256 genes
  ) {
    // Return mock data for testing - simplified to avoid stack too deep
    uint256 mockGenes = 123456789012345600;
    if (_id > 0) {
      mockGenes = mockGenes + _id;
    }

    return (
      false,
      true,
      0,
      0,
      0,
      1000000,
      0,
      0,
      1,
      mockGenes
    );
  }
}
