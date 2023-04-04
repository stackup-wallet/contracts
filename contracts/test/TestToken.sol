// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    uint8 private immutable decimal;

    constructor(uint8 _decimals, string memory _name, string memory _symbol) ERC20(_name, _symbol) {
        decimal = _decimals;
    }

    function decimals() public view override returns (uint8) {
        return decimal;
    }

    function mint(address to, uint256 amount) public {
        require(amount < 1 ether, "mint amount too high");
        _mint(to, amount);
    }
}
