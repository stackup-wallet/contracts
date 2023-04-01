import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { deployEntryPoint } from "accountabstraction/test/testutils";
import { ethers } from "hardhat";

import type { Signers } from "../types";
import {
  shouldInitializeCorrectly,
  shouldParsePaymasterAndDataCorrectly,
  shouldValidatePaymasterUserOpCorrectly,
} from "./VerifyingPaymaster.behavior";
import { deployVerifyingPaymasterFixture } from "./VerifyingPaymaster.fixture";

describe("VerifyingPaymaster", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.nonAdmin = signers[1];

    this.loadFixture = loadFixture;

    this.entryPoint = await deployEntryPoint(ethers.provider);
  });

  beforeEach(async function () {
    const { verifyingPaymaster } = await this.loadFixture(deployVerifyingPaymasterFixture(this.entryPoint.address));
    this.verifyingPaymaster = verifyingPaymaster;
  });

  describe("Initialize", function () {
    shouldInitializeCorrectly();
  });

  describe("Method parsePaymasterAndData", function () {
    shouldParsePaymasterAndDataCorrectly();
  });

  describe("Method validatePaymasterUserOp", function () {
    shouldValidatePaymasterUserOpCorrectly();
  });
});
