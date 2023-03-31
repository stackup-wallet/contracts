// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import { IEntryPoint } from "account-abstraction/contracts/interfaces/IEntryPoint.sol";
import { UserOperation } from "account-abstraction/contracts/interfaces/UserOperation.sol";
import { BasePaymaster } from "account-abstraction/contracts/core/BasePaymaster.sol";

/**
 * A paymaster based on account-abstraction/contracts/samples/VerifyingPaymaster.sol.
 * It has the same functionality as the sample, but with added support for withdrawing ERC20 tokens.
 * Note that the off-chain signer should have a strategy in place to handle a failed token withdrawal.
 */
contract VerifyingPaymaster is BasePaymaster {
    // Placeholder so lint won't complain.
    uint256 public state;

    constructor(IEntryPoint _entryPoint, address _owner) BasePaymaster(_entryPoint) {
        _transferOwnership(_owner);
    }

    function _validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 /*userOpHash*/,
        uint256 requiredPreFund
    ) internal override returns (bytes memory context, uint256 validationData) {
        userOp;
        requiredPreFund;
        state++;
        return ("", 0);
    }
}
