import { expect } from "chai";
import { ethers } from "hardhat";

export function shouldInitializeCorrectly(): void {
  it("should return the correct entryPoint", async function () {
    expect(await this.verifyingPaymaster.connect(this.signers.admin).entryPoint()).to.equal(
      ethers.utils.getAddress(this.entryPoint.address),
    );
  });

  it("should return the correct owner", async function () {
    expect(await this.verifyingPaymaster.connect(this.signers.admin).owner()).to.equal(
      await ethers.provider.getSigner().getAddress(),
    );
  });
}
