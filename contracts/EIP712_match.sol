// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;
import "./nft.sol";

contract EIP712_match is nft {
    
    address x;

    struct EIP712Domain {
        string  name;
        string  version;
        uint256 chainId;
        address verifyingContract;
    }

    struct Person {
        string name;
        address wallet;
    }

    struct Order {
        Person from;
        Person to;
        string contents;
    }

    struct Signature {
        uint8 v;
        bytes32 r;
        bytes32 s;
        bytes sighash;
    }

    bytes32 constant EIP712DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );

    bytes32 constant PERSON_TYPEHASH = keccak256(
        "Person(string name,address wallet)"
    );

    bytes32 constant ORDER_TYPEHASH = keccak256(
        "Order(Person from,Person to,string contents)Person(string name,address wallet)"
    );

    bytes32 DOMAIN_SEPARATOR;

     constructor () {
        DOMAIN_SEPARATOR = hash(EIP712Domain({
            name: "NFT Box",
            version: '1',
            chainId: 5,
            verifyingContract: 0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC
        }));
    }

     function hash(EIP712Domain memory eip712Domain) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            EIP712DOMAIN_TYPEHASH,
            keccak256(bytes(eip712Domain.name)),
            keccak256(bytes(eip712Domain.version)),
            eip712Domain.chainId,
            eip712Domain.verifyingContract
        ));
    }

    function hash(Person memory person) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            PERSON_TYPEHASH,
            keccak256(bytes(person.name)),
            person.wallet
        ));
    }

    function hash(Order memory order) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            ORDER_TYPEHASH,
            hash(order.from),
            hash(order.to),
            keccak256(bytes(order.contents))
        ));
    }
    function splitSignature(bytes memory sig) internal pure returns (uint8, bytes32, bytes32)
    {
        require(sig.length == 65);

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }
        return (v, r, s);
    }
    function executeSetIfSignatureMatch(
        bytes memory _sellerSig, bytes memory _buyerSig
    ) external returns(uint256) {
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        (v, r, s)= splitSignature(_sellerSig);
        Signature memory sellerSig = Signature(v, r, s, _sellerSig);
        
        (v, r, s)= splitSignature(_buyerSig);
        Signature memory buyerSig = Signature(v, r, s, _buyerSig);
        
        Order memory sellerOrder = Order({
            from: Person({
               name: "Cow",
               wallet: 0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826
            }),
            to: Person({
                name: "Bob",
                wallet: 0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB
            }),
            contents: "Mint & Transfer"
        });

        Order memory buyerOrder = Order({
            from: Person({
               name: "Cow",
               wallet: 0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826
            }),
            to: Person({
                name: "Bob",
                wallet: 0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB
            }),
            contents: "Mint & Transfer"
        });

        bytes32 sellerDigest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, hash(sellerOrder)));
        bytes32 buyerDigest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, hash(buyerOrder)));
        address seller = ecrecover(sellerDigest, sellerSig.v, sellerSig.r, sellerSig.s);
        address buyer = ecrecover(buyerDigest, buyerSig.v, buyerSig.r, buyerSig.s);

        require(seller != buyer, "No self-trading");
        require(sellerDigest == buyerDigest, "invaild contents");
        require(buyer == msg.sender, "invaild contents");
        set(buyer);
        uint256 tokenId = mintNFT(buyer, "https://ipfs.io/ipfs/QmSFXTq9kcCLrNk9QbEWR6REnidR6GjaovWGMW344Y6ME9/4.json");
        return tokenId;
        
    }

 
    function set(address _x) public {
        x = _x;
    }
    function getSet() public view returns(address){
        return x;
    }


 

}