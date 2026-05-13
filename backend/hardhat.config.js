require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.20",
  networks: {
    bsctestnet: {
      url: "https://bsc-testnet.publicnode.com",
      accounts: ["0x6317ed63eb772490b0c27d91bd91c76d2aff5e91e16eed6767b2173fb8002cc6"],
    },
  },
};
