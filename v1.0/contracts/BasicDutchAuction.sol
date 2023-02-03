//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract BasicDutchAuction{

    uint reservePrice;
    uint numBlocksAuctionOpen;
    uint offerPriceDecrement;
    uint startingBlock;
    uint public auctionCloseBlock;
    address public sellerAccountAddr;
    address payable sellerAccount;
    bool auctionEnd = false;

    constructor(uint _reservePrice, uint _numBlocksAuctionOpen, uint _offerPriceDecrement)
    {
        reservePrice = _reservePrice;
        numBlocksAuctionOpen = _numBlocksAuctionOpen;
        offerPriceDecrement = _offerPriceDecrement;
        startingBlock = block.number;
        auctionCloseBlock = startingBlock + numBlocksAuctionOpen;
        sellerAccountAddr = msg.sender;
        sellerAccount = payable(msg.sender);
    }

    function bid() public payable
    {
        require(auctionEnd == false && (block.number < auctionCloseBlock), "Bids are not being accepted, the auction has ended.");
        require(msg.value >= (reservePrice + (numBlocksAuctionOpen - ((block.number - startingBlock) * offerPriceDecrement))), "Your bid price is less than the required auction price.");
        finalize();
    }

    function finalize() internal
    {
        sellerAccount.transfer(msg.value);
        auctionEnd = true;
    }
}