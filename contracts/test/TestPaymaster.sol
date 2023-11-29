// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

/* solhint-disable no-empty-blocks */

import { IPaymaster } from "account-abstraction/contracts/interfaces/IPaymaster.sol";
import { UserOperation } from "account-abstraction/contracts/interfaces/UserOperation.sol";
import { IEntryPoint } from "account-abstraction/contracts/interfaces/IEntryPoint.sol";
import { TestGas } from "./TestGas.sol";

/**
 * @title TestPaymaster
 * @dev A contract to test gas related to paymasters.
 * This is primarily used by the bundler to verify that its UserOperation gas estimates are working.
 */
contract TestPaymaster is IPaymaster, TestGas {
    function validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 /*userOpHash*/,
        uint256 /*maxCost*/
    ) external pure returns (bytes memory context, uint256 validationData) {
        return (abi.encode(userOp.callGasLimit, userOp.paymasterAndData[20:]), 0);
    }

    function postOp(PostOpMode mode, bytes calldata context, uint256 /*actualGasCost*/) external {
        if (mode == PostOpMode.postOpReverted) {
            return;
        }
        (uint256 cgl, bytes memory data) = abi.decode(context, (uint256, bytes));

        if (cgl > 0) {
            // Force a validation OOG by causing a bad VGL estimate.
            // VGL is estimated by setting CGL to 0. If CGL is > 0 we'll waste gas to trigger an OOG error.
            uint256 times = abi.decode(data, (uint256));
            this.wasteGas(times);
        }
    }

    function addStake(address entryPoint) external payable {
        IEntryPoint(entryPoint).addStake{ value: msg.value }(86400);
    }

    function deposit(address entryPoint) public payable {
        IEntryPoint(entryPoint).depositTo{ value: msg.value }(address(this));
    }

    fallback() external payable {}

    receive() external payable {}
}
