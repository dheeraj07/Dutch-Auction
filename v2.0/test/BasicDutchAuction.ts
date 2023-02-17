import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import "@nomiclabs/hardhat-ethers";
import { ethers } from "hardhat";
import {expect} from 'chai'
const hre = require("hardhat");

const _reservePrice = 100;
const _numBlocksAuctionOpen = 50;
const _offerPriceDecrement = 1;

describe("NFT", function () {
  
  async function deployDutchAuctionTestFixture() 
  {
    const [owner, firstAcc, secondAcc] = await ethers.getSigners();

    const nftAuctionFactory = await ethers.getContractFactory("DUTCH_NFT");
    const nftAuctionContract = await nftAuctionFactory.deploy();
    
    await nftAuctionContract.mintNFT(firstAcc.address);

    const auctionFactory = await ethers.getContractFactory("BasicDutchAuction");
    const auctionContract = await auctionFactory.deploy(nftAuctionContract.address, 1, _reservePrice, _numBlocksAuctionOpen, _offerPriceDecrement);
    await nftAuctionContract.connect(firstAcc).approve(auctionContract.address, 1);

    return { nftAuctionContract, auctionContract, owner, firstAcc, secondAcc };
  }

  describe("Deployment", function () 
  {
      it("Check if the NFT is successfully escrowed in the auction contract", async function () 
      {
        const { nftAuctionContract, auctionContract, firstAcc } = await loadFixture(deployDutchAuctionTestFixture);
        
        const contractBalancePre = await nftAuctionContract.balanceOf(auctionContract.address);
        await auctionContract.connect(firstAcc).escrowNFT();
        const contractBalancePost = await nftAuctionContract.balanceOf(auctionContract.address);
        
        expect(contractBalancePre).to.equal(contractBalancePost.sub(ethers.BigNumber.from("1")));
      });

      it("Check if the NFT is successfully withdrawn from the sellers wallet", async function () 
      {
        const { nftAuctionContract, auctionContract, firstAcc } = await loadFixture(deployDutchAuctionTestFixture);
        
        const ownerBalancePre = await nftAuctionContract.balanceOf(firstAcc.address);
        await auctionContract.connect(firstAcc).escrowNFT();
        const ownerBalancePost = await nftAuctionContract.balanceOf(firstAcc.address);

        expect(ownerBalancePre).to.equal(ownerBalancePost.add(ethers.BigNumber.from("1")));
      });

      it("Check if the NFT is being successully transferred to the bidders wallet once the highest bid is received", async function () 
      {
        const { nftAuctionContract, auctionContract, firstAcc, secondAcc } = await loadFixture(deployDutchAuctionTestFixture);
        
        await auctionContract.connect(firstAcc).escrowNFT();
        const options = {value: 220};
        const buyerBalancePre = await nftAuctionContract.balanceOf(secondAcc.address);
        await auctionContract.connect(secondAcc).bid(options);
        const buyerBalancePost = await nftAuctionContract.balanceOf(secondAcc.address);

        expect(buyerBalancePost).to.equal(buyerBalancePre.add(ethers.BigNumber.from("1")));
      });

      it("Check if ETH is deposited into the seller's wallet upon auction completion", async function () 
      {
        const { auctionContract, firstAcc, secondAcc } = await loadFixture(deployDutchAuctionTestFixture);

        await auctionContract.connect(firstAcc).escrowNFT();
        const options = {value: 300};
        let sellerBalancePre = await firstAcc.getBalance();
        await auctionContract.connect(secondAcc).bid(options);
        let sellerBalancePost = await firstAcc.getBalance();

        expect(sellerBalancePost).to.equal(sellerBalancePre.add(ethers.BigNumber.from(options.value)));
      });

      it("Check if the NFT is successfully transferred back to the seller's wallet upon a failed auction", async function () 
      {
        const { nftAuctionContract, auctionContract, firstAcc } = await loadFixture(deployDutchAuctionTestFixture);
        
        await auctionContract.connect(firstAcc).escrowNFT();
        const sellerBalancePre = await nftAuctionContract.balanceOf(firstAcc.address);
        await hre.network.provider.send("hardhat_mine", ["0x100"]);
        await auctionContract.connect(firstAcc).endAuction();
        const sellerBalancePost = await nftAuctionContract.balanceOf(firstAcc.address);

        expect(sellerBalancePre).to.equal(sellerBalancePost.sub(ethers.BigNumber.from("1")));
      });

      it("Check if the (endAuction) function can only be triggered by the NFT Owner", async function () 
      {
        const { auctionContract } = await loadFixture(deployDutchAuctionTestFixture);

        await expect(auctionContract.endAuction()).revertedWith("Invalid call, Only owner of this NFT can trigger this call.");
      });

      it("Check if the auction initiater holds the auction NFT", async function () 
      {
        const { auctionContract } = await loadFixture(deployDutchAuctionTestFixture);

        await expect(auctionContract.escrowNFT()).revertedWith("Only owner of the NFT can start the auction.");
      });

      it("Check if the auction stops accepting new bids(from bid winner) once a bid is accepted", async function () 
      {
        const { auctionContract, firstAcc } = await loadFixture(deployDutchAuctionTestFixture);

        await auctionContract.connect(firstAcc).escrowNFT();
        const options = {value: 160};
        await auctionContract.bid(options);
  
        await expect(auctionContract.bid(options)).revertedWith("Bids are not being accepted, the auction has ended.");
      });

      it("Check if the auction stops accepting new bids(from participants other than bid winner) once a bid is accepted", async function () 
      {
        const { auctionContract, firstAcc } = await loadFixture(deployDutchAuctionTestFixture);

        await auctionContract.connect(firstAcc).escrowNFT();
        const options = {value: 160};
        await auctionContract.bid(options);
  
        await expect(auctionContract.connect(firstAcc).bid(options)).revertedWith("Bids are not being accepted, the auction has ended.");
      });

      it("Check if the auction stops considering bids once the auction close time (block) is elapsed", async function () 
      {
        const { auctionContract, firstAcc } = await loadFixture(deployDutchAuctionTestFixture);

        await auctionContract.connect(firstAcc).escrowNFT();
        const options = {value: 160};
        await hre.network.provider.send("hardhat_mine", ["0x100"]);
        
        await expect(auctionContract.bid(options)).to.be.revertedWith("Bids are not being accepted, the auction has ended.");
      });

      it("Check if the bids are getting rejected if the bid price is less than the auction minimum price", async function () 
      {
        const { auctionContract, firstAcc } = await loadFixture(deployDutchAuctionTestFixture);

        await auctionContract.connect(firstAcc).escrowNFT();
        const options = {value: 50};

        await expect(auctionContract.connect(firstAcc).bid(options)).to.be.revertedWith("Your bid price is less than the required auction price.");
      });
      
  });
});