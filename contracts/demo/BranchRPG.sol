// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract BranchRPG is ERC20 {
    uint256 public score;

    constructor() ERC20("BranchRPG", "WATER") {
        score = 0;
    }

    function mint(address to, uint256 amount) public {
        require(amount <= 1 ether, "mint amount too high");
        _mint(to, amount);
    }

    function burn(uint256 amount) public {
        _burn(_msgSender(), amount);
        score += amount;
    }
}
