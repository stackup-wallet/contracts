// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

/* solhint-disable no-empty-blocks */

import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { UserOperation } from "account-abstraction/contracts/interfaces/UserOperation.sol";

/**
 * A contract used by ERC-4337 bundlers along with Arbitrum's NodeInterface precompile to determine the
 * PreVerificationGas of a UserOperation.
 *
 * All interfaces should match the EntryPoint for consistency but with a noop implementation. This allows us
 * to get as close to the actual L1 callData cost as possible.
 */
contract ERC4337GasHelper is ReentrancyGuard {
    function handleOps(UserOperation[] calldata ops, address payable beneficiary) public nonReentrant {}
}
