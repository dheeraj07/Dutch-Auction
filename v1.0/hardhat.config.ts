import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomiclabs/hardhat-ethers";

import "solidity-coverage";


const config: HardhatUserConfig = {
  solidity: "0.8.17",
};

export default config;
