import React, { useState } from 'react';
import { ethers } from 'ethers';
import DutchAuctionArtifact from './artifacts/BasicDutchAuction.json';
import './App.css'

const App = () => {
  const [reservePrice, setReservePrice] = useState('');
  const [numBlocksAuctionOpen, setNumOfBlocks] = useState('');
  const [offerPriceDecrement, setPriceDecrement] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [inputContractAddress, setInputContractAddress] = useState('');
  const [contractDetails, setContractDetails] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidResult, setBidResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);


  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      } catch (error) {
        console.error('User denied account access:', error);
      }
    } else {
      alert('Please install MetaMask to use this app!');
    }
  };
  

  const deployAuction = async () => {
    try {
      await connectWallet();
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const factory = new ethers.ContractFactory(DutchAuctionArtifact.abi, DutchAuctionArtifact.bytecode, signer);
      const contract = await factory.deploy(reservePrice, numBlocksAuctionOpen, offerPriceDecrement);
      await contract.deployed();
      setContractAddress(contract.address);
    } catch (error) {
      console.error('Error deploying auction:', error);
    }
  };

  const fetchContractDetails = async () => {
    try {
      setIsLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(inputContractAddress, DutchAuctionArtifact.abi, provider);
  
      const reservePrice = await contract.reservePrice();
      const numBlocksAuctionOpen = await contract.numBlocksAuctionOpen();
      const offerPriceDecrement = await contract.offerPriceDecrement();
      const currentMinimumBidPrice = await contract.getCurrentBidPrice();
      const auctionStatus = await contract.auctionEnd();
      const buyerAddr = await contract.buyer();
  
      setContractDetails({
        reservePrice: reservePrice,
        numBlocksAuctionOpen: numBlocksAuctionOpen,
        offerPriceDecrement: offerPriceDecrement,
        currentMinimumBidPrice: currentMinimumBidPrice,
        auctionStatus: auctionStatus,
        buyer: buyerAddr
      });
    } catch (error) {
      console.error("Error fetching contract details:", error);
      setContractDetails(null);
    }
    finally {
      setIsLoading(false); 
    }
  };
  

  const placeBid = async () => {
    try {
      await connectWallet();
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(inputContractAddress, DutchAuctionArtifact.abi, signer);
      const gasPrice = ethers.utils.parseUnits("20", "gwei");
      const gasLimit = ethers.BigNumber.from("300000");
      const bidTx = await contract.bid({ value: bidAmount, gasPrice: gasPrice, gasLimit: gasLimit });
  
      try {
        await bidTx.wait();
        setBidResult('Bid accepted as the winner');
      } catch (error) {
        if (error.code === ethers.utils.Logger.errors.CALL_EXCEPTION) {
          setBidResult('Bid not accepted');
        } else {
          console.error('Error placing bid:', error);
        }
      }
    } catch (error) {
      setBidResult('Bid not accepted');
      console.error('Error placing bid:', error);
    }
  };
  

  return (
    <div className="App">

      <section>
        <h2>Deploy Auction</h2>
        <input
          type="number"
          value={reservePrice}
          onChange={(e) => setReservePrice(e.target.value)}
          placeholder="Reserve Price"
        />
        <input
          type="number"
          value={numBlocksAuctionOpen}
          onChange={(e) => setNumOfBlocks(e.target.value)}
          placeholder="Num of Blocks"
        />
        <input
          type="number"
          value={offerPriceDecrement}
          onChange={(e) => setPriceDecrement(e.target.value)}
          placeholder="Price Decrement"
        />
        <button onClick={deployAuction}>Deploy</button>
        {contractAddress && <div>Contract Address: {contractAddress}</div>}
      </section>

      <section>
        <h2>Fetch Contract Details</h2>
        <input
          type="text"
          value={inputContractAddress}
          onChange={(e) => setInputContractAddress(e.target.value)}
          placeholder="Contract Address"
        />
        <button onClick={fetchContractDetails}>Fetch</button>
        <div>
          {isLoading ? (
            "fetching"
          ) : contractDetails ? (
            <div>
            <p>Reserve Price: {contractDetails.reservePrice.toString()}</p>
            <p>Num of Blocks: {contractDetails.numBlocksAuctionOpen.toString()}</p>
            <p>Price Decrement: {contractDetails.offerPriceDecrement.toString()}</p>
            <p>Current Minimum bid to win: {contractDetails.currentMinimumBidPrice.toString()}</p>
            <p>Auction Status:{contractDetails.auctionStatus === true ? "Ended" : "Ongoing"} </p>
            {console.log(ethers.constants.AddressZero)}
            <p>Winner: {contractDetails.buyer.localeCompare(ethers.constants.AddressZero) === 0 ? "No winner yet" : contractDetails.buyer } </p>
          </div>
            ) : (
            "No contract details"
          )}
        </div>
      </section>

      <section>
        <h2>Place Bid</h2>
        <input
          type="number"
          value={bidAmount}
          onChange={(e) => setBidAmount(e.target.value)}
          placeholder="Bid Amount (ETH)"
        />
        <button onClick={placeBid}>Bid</button>
        {bidResult && <div>{bidResult}</div>}
      </section>
    </div>
  );
};

export default App;
