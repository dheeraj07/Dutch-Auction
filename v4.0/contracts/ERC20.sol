//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DutchAuctionERC20 is ERC20
{
    constructor(uint256 totalSupply) ERC20("DutchAuctionToken", "DAE20")
    {
        _mint(msg.sender, totalSupply * (10 ** decimals()));
    }
}