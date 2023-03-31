import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import type { IEntryPoint } from "../types/account-abstraction/contracts/interfaces";
import type { VerifyingPaymaster } from "../types/contracts";

type Fixture<T> = () => Promise<T>;

declare module "mocha" {
  export interface Context {
    entryPoint: IEntryPoint;
    verifyingPaymaster: VerifyingPaymaster;
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
    signers: Signers;
  }
}

export interface Signers {
  admin: SignerWithAddress;
}
