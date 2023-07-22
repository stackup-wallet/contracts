// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

/**
 * @title TestGas
 * @dev A contract with a collection of methods for testing certain edge cases related to gas.
 * This is primarily used by the bundler to verify that its UserOperation gas estimates are working.
 */
contract TestGas {
    mapping(uint256 => uint256) public store;
    uint256 public offset;

    /**
     * @dev This method allows you to run a recursive call where each nested call uses more gas than its parent.
     * @param depth Specifies the number of recursive calls to make.
     * @param count Specifies a countdown that decrements by 1 at each call.
     * @return sum Specifies the total writes made to the store.
     */
    function recursiveCall(uint8 depth, uint8 count) external payable returns (uint256) {
        uint8 sum = depth - count;
        for (uint8 i = 0; i <= sum; i++) {
            offset++;
            store[offset] = i + 1;
        }

        // We want to maintain the current function's stack frame, so no tail-recursion here.
        return count == 0 ? sum : sum + this.recursiveCall(depth, count - 1);
    }
}
