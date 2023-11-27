// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

/* solhint-disable no-empty-blocks */

import { IAccount } from "account-abstraction/contracts/interfaces/IAccount.sol";
import { UserOperation } from "account-abstraction/contracts/interfaces/UserOperation.sol";
import { TestGas } from "./TestGas.sol";

/**
 * @title TestAccount
 * @dev A contract to test gas related edge cases during verification.
 * This is primarily used by the bundler to verify that its UserOperation gas estimates are working.
 */
contract TestAccount is IAccount, TestGas {
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 /*userOpHash*/,
        uint256 missingAccountFunds
    ) external returns (uint256 validationData) {
        bytes2 sig = bytes2(userOp.signature);
        if (sig == 0x0001) {
            (uint256 depth, uint256 width, uint256 discount) = abi.decode(userOp.callData, (uint256, uint256, uint256));
            this.recursiveCall(depth, width, discount, depth);
        }
        if (sig == 0x0002 && userOp.callGasLimit > 0) {
            // Force a validation OOG by causing a bad VGL estimate.
            // VGL is estimated by setting CGL to 0. If CGL is > 0 we'll waste gas to trigger an OOG error.
            uint256 times = abi.decode(userOp.callData, (uint256));
            this.wasteGas(times);
        }

        if (missingAccountFunds > 0) {
            (bool success, bytes memory data) = msg.sender.call{ value: missingAccountFunds }("");
            (success, data);
        }
        return 0;
    }

    fallback() external payable {}

    receive() external payable {}
}
