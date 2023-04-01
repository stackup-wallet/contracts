import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Create2Factory } from "accountabstraction/src/Create2Factory";
import { ethers } from "hardhat";

import type { VerifyingPaymaster } from "../../types/contracts/VerifyingPaymaster";
import { VerifyingPaymaster__factory } from "../../types/factories/contracts/VerifyingPaymaster__factory";

export function deployVerifyingPaymasterFixture(ep: string): () => Promise<{ verifyingPaymaster: VerifyingPaymaster }> {
  return async function fixture() {
    // Setup owner EOA
    const signers: SignerWithAddress[] = await ethers.getSigners();
    const admin: SignerWithAddress = signers[0];

    // Deterministically deploy paymaster
    const create2factory = new Create2Factory(ethers.provider);
    const vpf: VerifyingPaymaster__factory = <VerifyingPaymaster__factory>(
      await ethers.getContractFactory("VerifyingPaymaster")
    );
    const addr = await create2factory.deploy(vpf.getDeployTransaction(ep, admin.address), 0);
    const verifyingPaymaster: VerifyingPaymaster = VerifyingPaymaster__factory.connect(addr, admin);

    // Stake and deposit paymaster with EntryPoint
    await Promise.all([
      verifyingPaymaster.addStake(1, { value: ethers.utils.parseEther("1") }),
      verifyingPaymaster.deposit({ value: ethers.utils.parseEther("1") }),
    ]);

    return { verifyingPaymaster };
  };
}
