import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import "@nomiclabs/hardhat-ethers";
import { ethers } from "hardhat";
import {expect} from 'chai'
const hre = require("hardhat");

const _reservePrice = 100;
const _numBlocksAuctionOpen = 50;
const _offerPriceDecrement = 1;

describe("BasicDutchAuction", function () {
  
  async function deployDutchAuctionTestFixture() 
  {
    const [owner, firstAcc] = await ethers.getSigners();

    const dutchAuctionFactory = await ethers.getContractFactory("BasicDutchAuction");
    const dutchAuctionContract = await dutchAuctionFactory.deploy(_reservePrice, _numBlocksAuctionOpen, _offerPriceDecrement);

    return { dutchAuctionContract, owner, firstAcc };
  }

  async function dutchAuctionUnlockTestFixture()
  {
    const [owner] = await ethers.getSigners();

    const dutchAuctionFactory = await ethers.getContractFactory("BasicDutchAuction");
    const dutchAuctionContract = await dutchAuctionFactory.deploy(_reservePrice, _numBlocksAuctionOpen, _offerPriceDecrement);

    const hashOfTx = dutchAuctionContract.deployTransaction.hash
    let contract = await dutchAuctionContract.deployed();
    let txReceipt = await contract.provider.getTransactionReceipt(hashOfTx);
    const deployedBlockNumber = txReceipt.blockNumber;

    return {dutchAuctionContract, _numBlocksAuctionOpen, deployedBlockNumber};
  }

  describe("Deployment", function () 
  {
      it("Check if the auction stops accepting new bids from the bid winner once a bid is accepted", async function () {
        const { dutchAuctionContract, owner, firstAcc } = await loadFixture(deployDutchAuctionTestFixture);
        const options = {value: 160};
        await dutchAuctionContract.bid(options);
  
        await expect(dutchAuctionContract.bid(options)).revertedWith("Bids are not being accepted, the auction has ended.");
      });

      it("Check if new bids are no longer accepted from participants other than the bid winner", async function () 
      {
        const { dutchAuctionContract, owner, firstAcc } = await loadFixture(deployDutchAuctionTestFixture);
        const options = {value: 160};
        await dutchAuctionContract.bid(options);
  
        await expect(dutchAuctionContract.connect(firstAcc).bid(options)).revertedWith("Bids are not being accepted, the auction has ended.");
      });

      it("Check if the auction stops considering bids once the auction close time (block) is reached", async function () 
      {
        const { dutchAuctionContract } = await loadFixture(deployDutchAuctionTestFixture);
        const options = {value: 160};
        await dutchAuctionContract.bid(options);
        await hre.network.provider.send("hardhat_mine", ["0x100"]);
        
        await expect(dutchAuctionContract.bid(options)).to.be.revertedWith("Bids are not being accepted, the auction has ended.");
      });

      it("Check if bids that are less than the auction bid amount are rejected", async function () 
      {
        const { dutchAuctionContract, owner, firstAcc } = await loadFixture(deployDutchAuctionTestFixture);
        const options = {value: 50};

        await expect(dutchAuctionContract.connect(firstAcc).bid(options)).to.be.revertedWith("Your bid price is less than the required auction price.");
      });

      it("Check if the auction close time is being set correctly", async function () 
      {
        const { dutchAuctionContract, _numBlocksAuctionOpen, deployedBlockNumber } = await loadFixture(dutchAuctionUnlockTestFixture);
        
        expect(await dutchAuctionContract.auctionCloseBlock()).to.equal(_numBlocksAuctionOpen+deployedBlockNumber);
      });

      it("Check if the auction seller is the contract owner", async function () 
      {
        const { dutchAuctionContract, owner } = await loadFixture(deployDutchAuctionTestFixture);

        await expect(await dutchAuctionContract.sellerAccountAddr()).to.equal(owner.address);
      });
      
  });
});
