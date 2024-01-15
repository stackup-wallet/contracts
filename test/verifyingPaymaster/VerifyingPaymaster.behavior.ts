import { fillAndSign } from "accountabstraction/test/UserOp";
import { UserOperation } from "accountabstraction/test/UserOperation";
import { createAccount, simulationResultCatch } from "accountabstraction/test/testutils";
import { EntryPoint, SimpleAccount, TestToken, TestToken__factory } from "accountabstraction/typechain";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

const MOCK_VALID_UNTIL = "0x00000000deadbeef";
const MOCK_VALID_AFTER = "0x0000000000001234";
const MOCK_SIG = "0x1234";
const MOCK_ERC20_ADDR = "0x" + "01".repeat(20);
// Assume TOKEN decimals is 18, then 1 ETH = 1000 TOKENS
const MOCK_FX = ethers.constants.WeiPerEther.mul(1000);

const encodePaymasterData = (token = ethers.constants.AddressZero, fx = ethers.constants.Zero) => {
  return ethers.utils.defaultAbiCoder.encode(
    ["uint48", "uint48", "address", "uint256"],
    [MOCK_VALID_UNTIL, MOCK_VALID_AFTER, token, fx],
  );
};

const encodeERC20Approval = (account: SimpleAccount, token: TestToken, spender: string, amount: BigNumber) => {
  return account.interface.encodeFunctionData("execute", [
    token.address,
    0,
    token.interface.encodeFunctionData("approve", [spender, amount]),
  ]);
};

const getUserOpEvent = async (ep: EntryPoint) => {
  const [log] = await ep.queryFilter(ep.filters.UserOperationEvent(), await ethers.provider.getBlockNumber());
  return log;
};

export function shouldInitializeCorrectly(): void {
  it("should return the correct entryPoint", async function () {
    expect(await this.verifyingPaymaster.entryPoint()).to.equal(ethers.utils.getAddress(this.entryPoint.address));
  });

  it("should return the correct owner", async function () {
    expect(await this.verifyingPaymaster.owner()).to.equal(await ethers.provider.getSigner().getAddress());
  });

  it("should initialize the verifier to equal owner", async function () {
    expect(await this.verifyingPaymaster.verifier()).to.equal(await this.verifyingPaymaster.owner());
  });

  it("should initialize the vault to equal owner", async function () {
    expect(await this.verifyingPaymaster.vault()).to.equal(await this.verifyingPaymaster.owner());
  });
}

export function shouldSetVerifierCorrectly(): void {
  it("should change the verifier address if called by owner", async function () {
    await this.verifyingPaymaster.setVerifier(this.signers.verifier.address);
    expect(await this.verifyingPaymaster.verifier()).to.equal(this.signers.verifier.address);
  });

  it("should revert if called by anyone else", async function () {
    const curr = await this.verifyingPaymaster.verifier();
    const verifier = ethers.Wallet.createRandom();
    const unauthorizedVPM = this.verifyingPaymaster.connect(this.signers.nonAdmin);
    await expect(unauthorizedVPM.setVerifier(verifier.address)).to.be.revertedWith("Ownable: caller is not the owner");
    expect(await this.verifyingPaymaster.verifier()).to.equal(curr);
  });
}

export function shouldSetVaultCorrectly(): void {
  it("should change the vault address if called by owner", async function () {
    const vault = ethers.Wallet.createRandom();
    await this.verifyingPaymaster.setVault(vault.address);
    expect(await this.verifyingPaymaster.vault()).to.equal(vault.address);
  });

  it("should revert if called by anyone else", async function () {
    const curr = await this.verifyingPaymaster.vault();
    const vault = ethers.Wallet.createRandom();
    const unauthorizedVPM = this.verifyingPaymaster.connect(this.signers.nonAdmin);
    await expect(unauthorizedVPM.setVault(vault.address)).to.be.revertedWith("Ownable: caller is not the owner");
    expect(await this.verifyingPaymaster.vault()).to.equal(curr);
  });
}

export function shouldParsePaymasterAndDataCorrectly(): void {
  it("should parse data properly", async function () {
    const paymasterAndData = ethers.utils.hexConcat([this.verifyingPaymaster.address, encodePaymasterData(), MOCK_SIG]);

    const res = await this.verifyingPaymaster.parsePaymasterAndData(paymasterAndData);
    expect(res.validUntil).to.equal(ethers.BigNumber.from(MOCK_VALID_UNTIL));
    expect(res.validAfter).to.equal(ethers.BigNumber.from(MOCK_VALID_AFTER));
    expect(res.erc20Token).to.equal(ethers.constants.AddressZero);
    expect(res.exchangeRate).to.equal(ethers.constants.Zero);
    expect(res.signature).to.equal(MOCK_SIG);
  });

  it("should parse data properly for ERC20 token use case", async function () {
    const paymasterAndData = ethers.utils.hexConcat([
      this.verifyingPaymaster.address,
      encodePaymasterData(MOCK_ERC20_ADDR, MOCK_FX),
      MOCK_SIG,
    ]);

    const res = await this.verifyingPaymaster.parsePaymasterAndData(paymasterAndData);
    expect(res.validUntil).to.equal(ethers.BigNumber.from(MOCK_VALID_UNTIL));
    expect(res.validAfter).to.equal(ethers.BigNumber.from(MOCK_VALID_AFTER));
    expect(res.erc20Token).to.equal(MOCK_ERC20_ADDR);
    expect(res.exchangeRate).to.equal(MOCK_FX);
    expect(res.signature).to.equal(MOCK_SIG);
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
        paymasterAndData: ethers.utils.hexConcat([this.verifyingPaymaster.address, encodePaymasterData(), "0x1234"]),
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
          encodePaymasterData(),
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
          paymasterAndData: ethers.utils.hexConcat([this.verifyingPaymaster.address, encodePaymasterData(), sig]),
        },
        this.signers.admin,
        this.entryPoint,
      );
    });

    it("should return signature error (no revert) on wrong verifier signature", async function () {
      const ret = await this.entryPoint.callStatic.simulateValidation(wrongSigUserOp).catch(simulationResultCatch);
      expect(ret.returnInfo.sigFailed).to.be.true;
    });

    it("should revert on signature failure in handleOps", async function () {
      await expect(this.entryPoint.estimateGas.handleOps([wrongSigUserOp], this.signers.nonAdmin.address))
        .to.to.be.revertedWithCustomError(this.entryPoint, "FailedOp")
        .withArgs(0, "AA34 signature error");
    });
  });

  describe("with correct signature", async function () {
    it("should succeed with valid signature", async function () {
      const partialUserOp = await fillAndSign(
        {
          sender: account.address,
          paymasterAndData: ethers.utils.hexConcat([
            this.verifyingPaymaster.address,
            encodePaymasterData(),
            "0x" + "00".repeat(65),
          ]),
        },
        this.signers.admin,
        this.entryPoint,
      );
      const hash = await this.verifyingPaymaster.getHash(
        partialUserOp,
        MOCK_VALID_UNTIL,
        MOCK_VALID_AFTER,
        ethers.constants.AddressZero,
        ethers.constants.Zero,
      );

      const sig = await this.signers.verifier.signMessage(ethers.utils.arrayify(hash));
      const userOp = await fillAndSign(
        {
          ...partialUserOp,
          paymasterAndData: ethers.utils.hexConcat([this.verifyingPaymaster.address, encodePaymasterData(), sig]),
        },
        this.signers.admin,
        this.entryPoint,
      );

      const res = await this.entryPoint.callStatic.simulateValidation(userOp).catch(simulationResultCatch);
      expect(res.returnInfo.sigFailed).to.be.false;
      expect(res.returnInfo.validAfter).to.equal(ethers.BigNumber.from(MOCK_VALID_AFTER));
      expect(res.returnInfo.validUntil).to.equal(ethers.BigNumber.from(MOCK_VALID_UNTIL));
      expect(res.returnInfo.paymasterContext).to.equal("0x");
    });

    it("should succeed with valid signature for ERC20 use case", async function () {
      const partialUserOp = await fillAndSign(
        {
          sender: account.address,
          paymasterAndData: ethers.utils.hexConcat([
            this.verifyingPaymaster.address,
            encodePaymasterData(MOCK_ERC20_ADDR, MOCK_FX),
            "0x" + "00".repeat(65),
          ]),
        },
        this.signers.admin,
        this.entryPoint,
      );
      const hash = await this.verifyingPaymaster.getHash(
        partialUserOp,
        MOCK_VALID_UNTIL,
        MOCK_VALID_AFTER,
        MOCK_ERC20_ADDR,
        MOCK_FX,
      );

      const sig = await this.signers.verifier.signMessage(ethers.utils.arrayify(hash));
      const userOp = await fillAndSign(
        {
          ...partialUserOp,
          paymasterAndData: ethers.utils.hexConcat([
            this.verifyingPaymaster.address,
            encodePaymasterData(MOCK_ERC20_ADDR, MOCK_FX),
            sig,
          ]),
        },
        this.signers.admin,
        this.entryPoint,
      );

      const res = await this.entryPoint.callStatic.simulateValidation(userOp).catch(simulationResultCatch);
      expect(res.returnInfo.sigFailed).to.be.false;
      expect(res.returnInfo.validAfter).to.equal(ethers.BigNumber.from(MOCK_VALID_AFTER));
      expect(res.returnInfo.validUntil).to.equal(ethers.BigNumber.from(MOCK_VALID_UNTIL));
      expect(res.returnInfo.paymasterContext).to.not.equal("0x");
    });
  });
}

export function shouldHandleOpsCorrectly() {
  let account: SimpleAccount;
  let token: TestToken;
  let vault: string;
  before(async function () {
    ({ proxy: account } = await createAccount(this.signers.admin, this.signers.admin.address, this.entryPoint.address));

    token = await new TestToken__factory(this.signers.admin).deploy();
    await token.mint(account.address, ethers.constants.MaxUint256);

    vault = await this.verifyingPaymaster.vault();
  });

  it("should pay with ERC20 tokens if approved", async function () {
    const partialUserOp = await fillAndSign(
      {
        sender: account.address,
        paymasterAndData: ethers.utils.hexConcat([
          this.verifyingPaymaster.address,
          encodePaymasterData(token.address, MOCK_FX),
          "0x" + "00".repeat(65),
        ]),
        callData: encodeERC20Approval(account, token, this.verifyingPaymaster.address, ethers.constants.MaxUint256),
      },
      this.signers.admin,
      this.entryPoint,
    );
    const hash = await this.verifyingPaymaster.getHash(
      partialUserOp,
      MOCK_VALID_UNTIL,
      MOCK_VALID_AFTER,
      token.address,
      MOCK_FX,
    );

    const sig = await this.signers.verifier.signMessage(ethers.utils.arrayify(hash));
    const userOp = await fillAndSign(
      {
        ...partialUserOp,
        paymasterAndData: ethers.utils.hexConcat([
          this.verifyingPaymaster.address,
          encodePaymasterData(token.address, MOCK_FX),
          sig,
        ]),
      },
      this.signers.admin,
      this.entryPoint,
    );

    const requiredPrefund = ethers.BigNumber.from(userOp.callGasLimit)
      .add(ethers.BigNumber.from(userOp.verificationGasLimit).mul(3))
      .add(userOp.preVerificationGas)
      .mul(userOp.maxFeePerGas);
    const initBalance = await token.balanceOf(vault);
    await this.entryPoint.handleOps([userOp], this.signers.admin.address);
    const postBalance = await token.balanceOf(vault);

    const ev = await getUserOpEvent(this.entryPoint);
    expect(ev.args.success).to.be.true;
    expect(postBalance.sub(initBalance)).to.be.greaterThan(ethers.constants.Zero);
    expect(postBalance.sub(initBalance)).to.be.lessThanOrEqual(
      requiredPrefund.mul(MOCK_FX).div(ethers.constants.WeiPerEther),
    );
  });

  it("should revert if ERC20 token withdrawal fails", async function () {
    const partialUserOp = await fillAndSign(
      {
        sender: account.address,
        paymasterAndData: ethers.utils.hexConcat([
          this.verifyingPaymaster.address,
          encodePaymasterData(token.address, MOCK_FX),
          "0x" + "00".repeat(65),
        ]),
        callData: encodeERC20Approval(account, token, this.verifyingPaymaster.address, ethers.constants.Zero),
      },
      this.signers.admin,
      this.entryPoint,
    );
    const hash = await this.verifyingPaymaster.getHash(
      partialUserOp,
      MOCK_VALID_UNTIL,
      MOCK_VALID_AFTER,
      token.address,
      MOCK_FX,
    );

    const sig = await this.signers.verifier.signMessage(ethers.utils.arrayify(hash));
    const userOp = await fillAndSign(
      {
        ...partialUserOp,
        paymasterAndData: ethers.utils.hexConcat([
          this.verifyingPaymaster.address,
          encodePaymasterData(token.address, MOCK_FX),
          sig,
        ]),
      },
      this.signers.admin,
      this.entryPoint,
    );

    const initBalance = await token.balanceOf(vault);
    await this.entryPoint.handleOps([userOp], this.signers.admin.address);
    const postBalance = await token.balanceOf(vault);

    const ev = await getUserOpEvent(this.entryPoint);
    expect(ev.args.success).to.be.false;
    expect(postBalance.sub(initBalance)).to.equal(ethers.constants.Zero);
  });
}
