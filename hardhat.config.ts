import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    dev: {
      url: `http://localhost:8545`,
      chainId: 1337, // config standard
      allowUnlimitedContractSize: true,
    },
    ec2: {
      url: process.env.EC2_NETWORK,
      accounts: [process.env.GOERLI_ADMIN!, process.env.GOERLI_OWNER!],
      allowUnlimitedContractSize: true,
      chainId: 1337,
    },
    goerli: {
      url: `https://goerli.infura.io/v3/a28baf7a2c2c4e269da3396d51e20bed`,
      accounts: [process.env.GOERLI_OWNER!, process.env.GOERLI_ADMIN!],
      chainId: 5,
    },
  },
};

export default config;
