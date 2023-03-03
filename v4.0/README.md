Dutch Auction Smart Contract - Version 4

1. Add an upgrade proxy to make your NFTDutchAuction_ERC20Bids.sol upgradeable. You don’t need to make the NFT or ERC20 contracts upgradeable, just the DutchAuction contract.
2. Use the UUPS proxy instead of a transparent proxy: https://docs.openzeppelin.com/contracts/4.x/api/proxy