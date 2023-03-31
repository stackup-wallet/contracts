import "@nomicfoundation/hardhat-toolbox";
import { config as dotenvConfig } from "dotenv";
import "hardhat-deploy";
import type { HardhatUserConfig } from "hardhat/config";
import type { NetworkUserConfig } from "hardhat/types";
import { resolve } from "path";

import "./tasks/accounts";

const dotenvConfigPath: string = process.env.DOTENV_CONFIG_PATH || "./.env";
dotenvConfig({ path: resolve(__dirname, dotenvConfigPath) });

// Ensure that we have all the environment variables we need.
const ep: string | undefined = process.env.ENTRY_POINT_ADDRESS;
const mnemonic: string | undefined = process.env.MNEMONIC;
if (!ep || !mnemonic) {
  throw new Error("Please set your MNEMONIC in a .env file");
}

function getChainConfig(jsonRpcUrl?: string): NetworkUserConfig {
  if (!jsonRpcUrl) {
    throw new Error("Please set your RPC urls in a .env file");
  }

  return {
    accounts: {
      mnemonic,
    },
    url: jsonRpcUrl,
  };
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      goerli: process.env.ETHERSCAN_API_KEY || "",
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || "",
      avalanche: process.env.SNOWTRACE_API_KEY || "",
      avalancheFuji: process.env.SNOWTRACE_API_KEY || "",
      optimismGoerli: process.env.OPTIMISM_API_KEY || "",
    },
  },
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false,
    excludeContracts: [],
    src: "./contracts",
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic,
      },
    },
    mainnet: getChainConfig(process.env.ETHEREUM_RPC),
    goerli: getChainConfig(process.env.GOERLI_RPC),
    polygon: getChainConfig(process.env.POLYGON_RPC),
    polygonMumbai: getChainConfig(process.env.POLYGON_MUMBAI_RPC),
    avalanche: getChainConfig(process.env.AVALANCHE_RPC),
    avalancheFuji: getChainConfig(process.env.AVALANCHE_FUJI_RPC),
    optimismGoerli: getChainConfig(process.env.OPTIMISM_GOERLI_RPC),
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    version: "0.8.17",
    settings: {
      metadata: {
        // Not including the metadata hash
        // https://github.com/paulrberg/hardhat-template/issues/31
        bytecodeHash: "none",
      },
      // Disable the optimizer when debugging
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 800,
      },
    },
  },
  typechain: {
    outDir: "types",
    target: "ethers-v5",
  },
};

export default config;
