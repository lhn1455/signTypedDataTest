// contracts/GameItem.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";


contract nft is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    bool private revealed = false;
    string private revealUrl = "https://ipfs.io/ipfs/QmSFXTq9kcCLrNk9QbEWR6REnidR6GjaovWGMW344Y6ME9/present.json";
    uint256 private time;
    constructor() ERC721("weshlist", "WEMIX") {
        time = block.timestamp;
    }

    function mintNFT(address collector, string memory _tokenURI)
        public
        returns (uint256)
    {
        _tokenIds.increment();

    
        uint256 newItemId = _tokenIds.current();
        _mint(collector, newItemId);
        _setTokenURI(newItemId, _tokenURI);



        return newItemId;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory){
        if(block.timestamp >= time + 3 minutes) {
            return super.tokenURI(tokenId);

        } else {
            return revealUrl;
        }
    }

    function revealCollection() public {
        revealed = true ; 
    }

    function getReveal() public view returns(bool){
        return revealed;
    }

    function safeTransfer(address from, address to, uint256 tokenId) public {
        require(block.timestamp >= time + 2 minutes, "no time to sell"); 
        safeTransferFrom(from, to, tokenId);

    }

}