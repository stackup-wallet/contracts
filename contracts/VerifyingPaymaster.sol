// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

import { IEntryPoint } from "account-abstraction/contracts/interfaces/IEntryPoint.sol";
import { UserOperation } from "account-abstraction/contracts/interfaces/UserOperation.sol";
import { UserOperationLib } from "account-abstraction/contracts/interfaces/UserOperation.sol";
import { BasePaymaster } from "account-abstraction/contracts/core/BasePaymaster.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "account-abstraction/contracts/core/Helpers.sol" as Helpers;

/**
 * A paymaster based on the eth-infinitism sample VerifyingPaymaster contract.
 * It has the same functionality as the sample, but with added support for withdrawing ERC20 tokens.
 * Note that the off-chain signer should have a strategy in place to handle a failed token withdrawal.
 *
 * See account-abstraction/contracts/samples/VerifyingPaymaster.sol for detailed comments.
 */
contract VerifyingPaymaster is BasePaymaster {
    using ECDSA for bytes32;
    using UserOperationLib for UserOperation;

    mapping(address sender => uint256 nonce) public senderNonce;

    uint256 private constant VALID_TIMESTAMP_OFFSET = 20;

    uint256 private constant SIGNATURE_OFFSET = 84;

    constructor(IEntryPoint _entryPoint, address _owner) BasePaymaster(_entryPoint) {
        _transferOwnership(_owner);
    }

    function pack(UserOperation calldata userOp) internal pure returns (bytes memory ret) {
        bytes calldata pnd = userOp.paymasterAndData;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            let ofs := userOp
            let len := sub(sub(pnd.offset, ofs), 32)
            ret := mload(0x40)
            mstore(0x40, add(ret, add(len, 32)))
            mstore(ret, len)
            calldatacopy(add(ret, 32), ofs, len)
        }
    }

    function getHash(
        UserOperation calldata userOp,
        uint48 validUntil,
        uint48 validAfter
    ) public view returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    pack(userOp),
                    block.chainid,
                    address(this),
                    senderNonce[userOp.getSender()],
                    validUntil,
                    validAfter
                )
            );
    }

    function _validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 /*userOpHash*/,
        uint256 requiredPreFund
    ) internal override returns (bytes memory context, uint256 validationData) {
        (requiredPreFund);

        (uint48 validUntil, uint48 validAfter, bytes calldata signature) = parsePaymasterAndData(
            userOp.paymasterAndData
        );
        // solhint-disable-next-line reason-string
        require(
            signature.length == 64 || signature.length == 65,
            "VerifyingPaymaster: invalid signature length in paymasterAndData"
        );
        bytes32 hash = ECDSA.toEthSignedMessageHash(getHash(userOp, validUntil, validAfter));
        senderNonce[userOp.getSender()]++;

        if (owner() != ECDSA.recover(hash, signature)) {
            return ("", Helpers._packValidationData(true, validUntil, validAfter));
        }

        return ("", Helpers._packValidationData(false, validUntil, validAfter));
    }

    function parsePaymasterAndData(
        bytes calldata paymasterAndData
    ) public pure returns (uint48 validUntil, uint48 validAfter, bytes calldata signature) {
        (validUntil, validAfter) = abi.decode(
            paymasterAndData[VALID_TIMESTAMP_OFFSET:SIGNATURE_OFFSET],
            (uint48, uint48)
        );
        signature = paymasterAndData[SIGNATURE_OFFSET:];
    }
}
