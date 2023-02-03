Dutch Auction Smart Contract - Version 1

The BasicDutchAuction.sol contract works as follows:
1. The seller instantiates a DutchAuction contract to manage the auction of a single, physical item at a single auction event. 
The contract is initialized with the following parameters: 
    1. reservePrice: the minimum amount of wei that the seller is willing to accept for the item 
    2. numBlocksAuctionOpen: the number of blockchain blocks that the auction is open for
    3. offerPriceDecrement: the amount of wei that the auction price should decrease by during each subsequent block. 
2. The seller is the owner of the contract. 
3. The auction begins at the block in which the contract is created. 
4. The initial price of the item is derived from reservePrice, numBlocksAuctionOpen, and  offerPriceDecrement: initialPrice = reservePrice + numBlocksAuctionOpen*offerPriceDecrement 
5. A bid can be submitted by any Ethereum externally-owned account. 
6. The first bid processed by the contract that sends wei greater than or equal to the current price is the  winner. The wei should be transferred immediately to the seller and the contract should not accept  any more bids. All bids besides the winning bid should be refunded immediately. 
