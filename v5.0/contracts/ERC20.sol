//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract DutchAuctionERC20 is ERC20, ERC20Permit
{
    constructor(uint256 totalSupply) ERC20("DutchAuctionToken", "DAE20") ERC20Permit("DutchAuctionToken") 
    {
        _mint(msg.sender, totalSupply * (10 ** decimals()));
    }
}