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
     * @param width Specifies the number of sibling calls at each depth to make.
     * @param count Specifies a countdown that decrements by 1 at each call.
     * @return sum Specifies the total writes made to the store.
     */
    function recursiveCall(uint256 depth, uint256 width, uint256 count) external payable returns (uint256) {
        // Gas wasting logic.
        uint256 sum = depth - count;
        for (uint256 i = 0; i <= sum; i++) {
            offset++;
            store[offset] = i + 1;
        }

        // Create multiple calls at a given depth.
        uint256 nestedSum = 0;
        if (count != 0) {
            for (uint256 i = 0; i <= width; i++) {
                nestedSum += this.recursiveCall(depth, width, count - 1);
            }
        }

        // Maintain the function's stack frame.
        return sum + nestedSum;
    }
}
