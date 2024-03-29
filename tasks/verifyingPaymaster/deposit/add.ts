import { TransactionResponse } from "@ethersproject/abstract-provider";
import { task } from "hardhat/config";

task("verifyingPaymaster:deposit:add", "Adds a deposit for the paymaster to the EntryPoint")
  .addPositionalParam("paymaster")
  .addPositionalParam("eth")
  .setAction(async (taskArgs, hre) => {
    const ethers = hre.ethers;

    const pm = taskArgs.paymaster;
    if (!ethers.utils.isAddress(pm)) {
      throw new Error("invalid paymaster address");
    }

    let value = ethers.constants.Zero;
    try {
      value = ethers.utils.parseEther(taskArgs.eth);
    } catch (error) {
      throw new Error("invalid eth value");
    }

    const signer = ethers.provider.getSigner();
    const pmc = (await ethers.getContractFactory("VerifyingPaymaster", signer)).attach(pm);
    const transaction = (await pmc.deposit({ value })) as TransactionResponse;
    const receipt = await transaction.wait();
    console.log(`Paymaster deposit added at: ${receipt.transactionHash}`);
  });
