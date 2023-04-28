import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const provider = ethers.provider;
  const from = await provider.getSigner().getAddress();

  await hre.deployments.deploy("ERC4337GasHelper", {
    from,
    log: true,
    deterministicDeployment: true,
  });
};

func.skip = async (_: HardhatRuntimeEnvironment): Promise<boolean> => {
  const runOnly = process.env.RUN_ONLY?.split(",");
  if (!runOnly || runOnly.length === 0) return false;

  return !runOnly.includes("3");
};

export default func;
