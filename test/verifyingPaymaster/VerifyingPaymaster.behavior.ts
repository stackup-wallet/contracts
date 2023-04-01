import { fillAndSign } from "accountabstraction/test/UserOp";
import { UserOperation } from "accountabstraction/test/UserOperation";
import { createAccount, simulationResultCatch } from "accountabstraction/test/testutils";
import { SimpleAccount } from "accountabstraction/typechain";
import { expect } from "chai";
import { ethers } from "hardhat";

const MOCK_VALID_UNTIL = "0x00000000deadbeef";
const MOCK_VALID_AFTER = "0x0000000000001234";
const MOCK_SIG = "0x1234";

export function shouldInitializeCorrectly(): void {
  it("should return the correct entryPoint", async function () {
    expect(await this.verifyingPaymaster.entryPoint()).to.equal(ethers.utils.getAddress(this.entryPoint.address));
  });

  it("should return the correct owner", async function () {
    expect(await this.verifyingPaymaster.owner()).to.equal(await ethers.provider.getSigner().getAddress());
  });
}

export function shouldParsePaymasterAndDataCorrectly(): void {
  it("should parse data properly", async function () {
    const paymasterAndData = ethers.utils.hexConcat([
      this.verifyingPaymaster.address,
      ethers.utils.defaultAbiCoder.encode(["uint48", "uint48"], [MOCK_VALID_UNTIL, MOCK_VALID_AFTER]),
      MOCK_SIG,
    ]);

    const res = await this.verifyingPaymaster.parsePaymasterAndData(paymasterAndData);
    expect(res.validUntil).to.be.equal(ethers.BigNumber.from(MOCK_VALID_UNTIL));
    expect(res.validAfter).to.be.equal(ethers.BigNumber.from(MOCK_VALID_AFTER));
    expect(res.signature).equal(MOCK_SIG);
  });
}

export function shouldValidatePaymasterUserOpCorrectly(): void {
  let account: SimpleAccount;
  before(async function () {
    ({ proxy: account } = await createAccount(this.signers.admin, this.signers.admin.address, this.entryPoint.address));
  });

  it("should revert on no signature", async function () {
    const userOp = await fillAndSign(
      {
        sender: account.address,
        paymasterAndData: ethers.utils.hexConcat([
          this.verifyingPaymaster.address,
          ethers.utils.defaultAbiCoder.encode(["uint48", "uint48"], [MOCK_VALID_UNTIL, MOCK_VALID_AFTER]),
          "0x1234",
        ]),
      },
      this.signers.admin,
      this.entryPoint,
    );

    await expect(this.entryPoint.callStatic.simulateValidation(userOp))
      .to.be.revertedWithCustomError(this.entryPoint, "FailedOp")
      .withArgs(0, "AA33 reverted: VerifyingPaymaster: invalid signature length in paymasterAndData");
  });

  it("should revert on invalid signature", async function () {
    const userOp = await fillAndSign(
      {
        sender: account.address,
        paymasterAndData: ethers.utils.hexConcat([
          this.verifyingPaymaster.address,
          ethers.utils.defaultAbiCoder.encode(["uint48", "uint48"], [MOCK_VALID_UNTIL, MOCK_VALID_AFTER]),
          "0x" + "00".repeat(65),
        ]),
      },
      this.signers.admin,
      this.entryPoint,
    );

    await expect(this.entryPoint.callStatic.simulateValidation(userOp))
      .to.be.revertedWithCustomError(this.entryPoint, "FailedOp")
      .withArgs(0, "AA33 reverted: ECDSA: invalid signature");
  });

  describe("with wrong signature", async function () {
    let wrongSigUserOp: UserOperation;

    before(async function () {
      const sig = await this.signers.nonAdmin.signMessage(ethers.utils.arrayify("0xdead"));
      wrongSigUserOp = await fillAndSign(
        {
          sender: account.address,
          paymasterAndData: ethers.utils.hexConcat([
            this.verifyingPaymaster.address,
            ethers.utils.defaultAbiCoder.encode(["uint48", "uint48"], [MOCK_VALID_UNTIL, MOCK_VALID_AFTER]),
            sig,
          ]),
        },
        this.signers.admin,
        this.entryPoint,
      );
    });

    it("should return signature error (no revert) on wrong signer signature", async function () {
      const ret = await this.entryPoint.callStatic.simulateValidation(wrongSigUserOp).catch(simulationResultCatch);
      expect(ret.returnInfo.sigFailed).to.be.true;
    });

    it("should revert on signature failure in handleOps", async function () {
      await expect(this.entryPoint.estimateGas.handleOps([wrongSigUserOp], this.signers.nonAdmin.address))
        .to.to.be.revertedWithCustomError(this.entryPoint, "FailedOp")
        .withArgs(0, "AA34 signature error");
    });
  });

  it("should succeed with valid signature", async function () {
    const partialUserOp = await fillAndSign(
      {
        sender: account.address,
        paymasterAndData: ethers.utils.hexConcat([
          this.verifyingPaymaster.address,
          ethers.utils.defaultAbiCoder.encode(["uint48", "uint48"], [MOCK_VALID_UNTIL, MOCK_VALID_AFTER]),
          "0x" + "00".repeat(65),
        ]),
      },
      this.signers.admin,
      this.entryPoint,
    );
    const hash = await this.verifyingPaymaster.getHash(partialUserOp, MOCK_VALID_UNTIL, MOCK_VALID_AFTER);

    const sig = await this.signers.admin.signMessage(ethers.utils.arrayify(hash));
    const userOp = await fillAndSign(
      {
        ...partialUserOp,
        paymasterAndData: ethers.utils.hexConcat([
          this.verifyingPaymaster.address,
          ethers.utils.defaultAbiCoder.encode(["uint48", "uint48"], [MOCK_VALID_UNTIL, MOCK_VALID_AFTER]),
          sig,
        ]),
      },
      this.signers.admin,
      this.entryPoint,
    );

    const res = await this.entryPoint.callStatic.simulateValidation(userOp).catch(simulationResultCatch);
    expect(res.returnInfo.sigFailed).to.be.false;
    expect(res.returnInfo.validAfter).to.be.equal(ethers.BigNumber.from(MOCK_VALID_AFTER));
    expect(res.returnInfo.validUntil).to.be.equal(ethers.BigNumber.from(MOCK_VALID_UNTIL));
  });
}
