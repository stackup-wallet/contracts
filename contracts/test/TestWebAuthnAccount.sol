// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

/* solhint-disable no-empty-blocks */

import { IAccount } from "account-abstraction/contracts/interfaces/IAccount.sol";
import { UserOperation } from "account-abstraction/contracts/interfaces/UserOperation.sol";
import { Base64 } from "../utils/Base64.sol";
import { LibSecp256r1 } from "../utils/Secp256r1.sol";

/**
 * @title TestWebAuthnAccount
 * @dev A contract to test UserOp verification with WebAuthn.
 * This contract is not safe for production since any public key (Q) can be used.
 * We are only interested in using this to test Bundler tracing.
 */
contract TestWebAuthnAccount is IAccount {
    function validateSignature(uint256[2] memory q, bytes32 _hash, bytes memory _signature) public view returns (bool) {
        (
            uint256 rValue,
            uint256 sValue,
            bytes memory authenticatorData,
            string memory clientDataJSONPre,
            string memory clientDataJSONPost
        ) = abi.decode(_signature, (uint256, uint256, bytes, string, string));
        bytes32 clientHash;
        {
            string memory opHashBase64 = Base64.encode(bytes.concat(_hash));
            string memory clientDataJSON = string.concat(clientDataJSONPre, opHashBase64, clientDataJSONPost);
            clientHash = sha256(bytes(clientDataJSON));
        }
        bytes32 sigHash = sha256(bytes.concat(authenticatorData, clientHash));
        return LibSecp256r1.Verify(q, rValue, sValue, uint256(sigHash));
    }

    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256 validationData) {
        validationData = 0;
        (uint[2] memory q, bytes memory signature) = abi.decode(userOp.signature, (uint[2], bytes));
        if (!validateSignature(q, userOpHash, signature)) {
            validationData = 1;
        }

        if (missingAccountFunds > 0) {
            (bool success, bytes memory data) = msg.sender.call{ value: missingAccountFunds }("");
            (success, data);
        }
        return validationData;
    }

    fallback() external payable {}

    receive() external payable {}
}
