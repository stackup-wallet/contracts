import { task } from "hardhat/config";

import EntryPoint from "../../../account-abstraction/deployments/mainnet/EntryPoint.json";

task("verifyingPaymaster:deposit:get", "Get deposit info for a paymaster")
  .addPositionalParam("paymaster")
  .setAction(async (taskArgs, hre) => {
    const ethers = hre.ethers;

    const pm = taskArgs.paymaster;
    if (!ethers.utils.isAddress(pm)) {
      throw new Error("invalid paymaster address");
    }

    const ep = new ethers.Contract(process.env.ENTRY_POINT_ADDRESS as string, EntryPoint.abi, ethers.provider);
    const dep = await ep.getDepositInfo(pm);
    console.log(`Deposit: ${ethers.utils.formatEther(dep[0])}`);
    console.log(`Is staked: ${dep[1]}`);
    console.log(`Stake: ${ethers.utils.formatEther(dep[2])}`);
    console.log(`Unstake delay (sec): ${dep[3]}`);
    console.log(`Withdraw time: ${dep[4]}`);
  });
