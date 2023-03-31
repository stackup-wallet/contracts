import { Create2Factory } from "accountabstraction/src/Create2Factory";
import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (_: HardhatRuntimeEnvironment) {
  await new Create2Factory(ethers.provider).deployFactory();
};

export default func;
