// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

/* solhint-disable avoid-low-level-calls */

import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title TestGas
 * @dev A contract with a collection of methods for testing certain edge cases related to gas.
 * This is primarily used by the bundler to verify that its UserOperation gas estimates are working.
 */
contract TestGas {
    mapping(uint256 key => uint256 value) public store;
    uint256 public offset;

    /**
     * @dev This method allows you to waste gas by writting to the store a specified amount of times.
     * @param times Specifies the total writes made to the store.
     */
    function wasteGas(uint256 times) public {
        for (uint256 i = 0; i < times; i++) {
            offset++;
            store[offset] = i + 1;
        }
    }

    /**
     * @dev This method allows you to run a recursive call where each nested call uses more gas than its parent.
     * @param depth Specifies the number of recursive calls to make.
     * @param width Specifies the number of sibling calls at each depth to make.
     * @param discount If non-zero, will provide a gas value equal to gasleft() - discount to recursive calls.
     * @param count Specifies a countdown that decrements by 1 at each call.
     * @return sum Specifies the total writes made to the store.
     */
    function recursiveCall(
        uint256 depth,
        uint256 width,
        uint256 discount,
        uint256 count
    ) external payable returns (uint256) {
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
                if (discount > 0) {
                    uint256 gas = gasleft();
                    nestedSum += this.recursiveCall{ value: msg.value, gas: gas - Math.min(discount, gas) }(
                        depth,
                        width,
                        discount,
                        count - 1
                    );
                } else {
                    nestedSum += this.recursiveCall{ value: msg.value }(depth, width, discount, count - 1);
                }
            }
        }

        // Maintain the function's stack frame.
        return sum + nestedSum;
    }

    /**
     * @dev This method will trigger an error in the current call frame.
     */
    function triggerRevert() external pure {
        revert("TestGas: revert triggered");
    }

    /**
     * @dev This method will trigger an error in a nested call frame and stop it from bubbling up.
     */
    function handleRevert() external {
        (bool success, ) = address(this).call(abi.encodeWithSignature("triggerRevert()"));
        (success);
    }
}
