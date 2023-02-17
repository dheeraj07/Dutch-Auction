//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";


contract BasicDutchAuction{

    uint reservePrice;
    uint numBlocksAuctionOpen;
    uint offerPriceDecrement;
    uint startingBlock;
    uint public auctionCloseBlock;
    address public sellerAccountAddr;
    address payable sellerAccount;
    bool auctionEnd = false;
    bool auctionStart = false;
    IERC721 public nft;
    uint nftID;

    constructor(address erc721TokenAddress, uint256 _nftTokenId, uint _reservePrice, uint _numBlocksAuctionOpen, uint _offerPriceDecrement)
    {
        reservePrice = _reservePrice;
        numBlocksAuctionOpen = _numBlocksAuctionOpen;
        offerPriceDecrement = _offerPriceDecrement;
        nft = IERC721(erc721TokenAddress);
        nftID = _nftTokenId;
    }

    function escrowNFT() public
    {
        sellerAccountAddr = msg.sender;
        sellerAccount = payable(msg.sender);
        require(nft.ownerOf(nftID) == sellerAccountAddr, "Only owner of the NFT can start the auction.");
        nft.safeTransferFrom(sellerAccountAddr, address(this), nftID);
        startingBlock = block.number;
        auctionCloseBlock = startingBlock + numBlocksAuctionOpen;
        auctionStart = true;
    }

    function bid() public payable
    {
        require(auctionStart == true, "Auction is not started yet!");
        require(auctionEnd == false && (block.number < auctionCloseBlock), "Bids are not being accepted, the auction has ended.");
        require(msg.value >= (reservePrice + (numBlocksAuctionOpen - ((block.number - startingBlock) * offerPriceDecrement))), "Your bid price is less than the required auction price.");
        finalize();
    }

    function finalize() internal
    {
        sellerAccount.transfer(msg.value);
        nft.safeTransferFrom(address(this), msg.sender, nftID);
        auctionEnd = true;
    }

    function endAuction() public
    {
        require(msg.sender == sellerAccountAddr, "Invalid call, Only owner of this NFT can trigger this call.");
        require(auctionEnd == false, "Cannot halt the auction as it is successfully completed.");
        require(block.number > auctionCloseBlock, "Cannot halt the auction as it is in the process.");
        auctionEnd = true;
        nft.safeTransferFrom(address(this), sellerAccount, nftID);
    }

    function onERC721Received(address operator, address from, uint tokenId, bytes calldata data) public view returns(bytes4)
    {
        return IERC721Receiver.onERC721Received.selector;
    }
}