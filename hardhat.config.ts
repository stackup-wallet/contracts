import "@nomicfoundation/hardhat-toolbox";
import { config as dotenvConfig } from "dotenv";
import "hardhat-deploy";
import { type HardhatUserConfig, extendEnvironment } from "hardhat/config";
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

  if (process.env.DEPLOY_WITH_RPC != "") {
    return {
      accounts: "remote",
      url: process.env.DEPLOY_WITH_RPC,
    };
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
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || "",
      avalanche: process.env.SNOWTRACE_API_KEY || "",
      avalancheFujiTestnet: process.env.SNOWTRACE_API_KEY || "",
      optimisticEthereum: process.env.OPTIMISM_API_KEY || "",
      optimisticGoerli: process.env.OPTIMISM_API_KEY || "",
      optimismSepolia: process.env.OPTIMISM_API_KEY || "",
      bsc: process.env.BSCSCAN_API_KEY || "",
      bscTestnet: process.env.BSCSCAN_API_KEY || "",
      arbitrumOne: process.env.ARBISCAN_API_KEY || "",
      arbitrumGoerli: process.env.ARBISCAN_API_KEY || "",
      arbitrumSepolia: process.env.ARBISCAN_API_KEY || "",
      base: process.env.BASESCAN_API_KEY || "",
      baseGoerli: process.env.BASESCAN_API_KEY || "",
      baseSepolia: process.env.BASESCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "arbitrumSepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io",
        },
      },
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org",
        },
      },
      {
        network: "baseGoerli",
        chainId: 84531,
        urls: {
          apiURL: "https://api-goerli.basescan.org/api",
          browserURL: "https://goerli.basescan.org",
        },
      },
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
      {
        network: "optimismSepolia",
        chainId: 11155420,
        urls: {
          apiURL: "https://api-sepolia-optimistic.etherscan.io/api",
          browserURL: "https://sepolia-optimism.etherscan.io",
        },
      },
    ],
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
    localhost: {
      saveDeployments: false,
    },
    mainnet: getChainConfig(process.env.ETHEREUM_RPC),
    goerli: getChainConfig(process.env.GOERLI_RPC),
    sepolia: getChainConfig(process.env.SEPOLIA_RPC),
    polygon: getChainConfig(process.env.POLYGON_RPC),
    polygonMumbai: getChainConfig(process.env.POLYGON_MUMBAI_RPC),
    avalanche: getChainConfig(process.env.AVALANCHE_RPC),
    avalancheFuji: getChainConfig(process.env.AVALANCHE_FUJI_RPC),
    optimism: getChainConfig(process.env.OPTIMISM_RPC),
    optimismGoerli: getChainConfig(process.env.OPTIMISM_GOERLI_RPC),
    optimismSepolia: getChainConfig(process.env.OPTIMISM_SEPOLIA_RPC),
    bsc: getChainConfig(process.env.BSC_RPC),
    bscTestnet: getChainConfig(process.env.BSC_TESTNET_RPC),
    arbitrumOne: getChainConfig(process.env.ARBITRUM_ONE_RPC),
    arbitrumGoerli: getChainConfig(process.env.ARBITRUM_GOERLI_RPC),
    arbitrumSepolia: getChainConfig(process.env.ARBITRUM_SEPOLIA_RPC),
    base: getChainConfig(process.env.BASE_RPC),
    baseGoerli: getChainConfig(process.env.BASE_GOERLI_RPC),
    baseSepolia: getChainConfig(process.env.BASE_SEPOLIA_RPC),
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    version: "0.8.19",
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
