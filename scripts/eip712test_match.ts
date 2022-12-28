var Web3 = require("web3");
var web3 = new Web3(process.env.EC2_NETWORK);
import { AbiItem } from "web3-utils";
import EIP712_match from "../artifacts/contracts/EIP712_match.sol/EIP712_match.json";
import {
  SignTypedDataVersion,
  recoverTypedSignature,
} from "@metamask/eth-sig-util";

require("dotenv").config();

const admin = web3.eth.accounts.privateKeyToAccount(process.env.GOERLI_ADMIN!);
const owner = web3.eth.accounts.privateKeyToAccount(process.env.GOERLI_OWNER!);
const privKey = process.env.GOERLI_OWNER;

web3.eth
  .getBalance(owner.address)
  .then((result: any) => console.log("result : ", owner.address));

async function main() {
  const eIP712_match = await new web3.eth.Contract(
    EIP712_match.abi as AbiItem[]
  );
  const tx = await eIP712_match.deploy({
    data: EIP712_match.bytecode,
  });

  const signTx = await web3.eth.accounts.signTransaction(
    {
      from: owner.address,
      data: tx.encodeABI(),
      gas: "6721975",
    },
    privKey!
  );
  const TxReceipt = await web3.eth.sendSignedTransaction(
    signTx.rawTransaction!
  );

  console.log("TxReceipt:", TxReceipt);
  const contractAddress = TxReceipt.contractAddress;
  const contract = new web3.eth.Contract(EIP712_match.abi, contractAddress);
  const test = await contract.methods.getSet().call();
  const sellerSignature =
    "0x588ad70801d0009ce4dc2541c9ea810fd1451bd24483ddf7c6127b18a59495c42b9a608f543895f5a401e02118930269fc637e900fcec59460f33859f537f9541b";

  const buyerSignature =
    "0xb0b63ae59ba9d60921e459013c2a29b737f210399600416b39ac5e44f91dc6fe017d7faf7a45e9dd7cc7d1c74ac0e17ab658ba7a1992b4b3fdf66b1c70ac2a791c";
  const res = await contract.methods
    .executeSetIfSignatureMatch(sellerSignature, buyerSignature)
    .send({
      from: owner.address,
      gasPrice: 20000000000,
      gasLimit: 100000,
      gas: 6721975,
    });
  console.log(res);

  const typedData = {
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      Person: [
        { name: "name", type: "string" },
        { name: "wallet", type: "address" },
      ],
      Mail: [
        { name: "from", type: "Person" },
        { name: "to", type: "Person" },
        { name: "contents", type: "string" },
      ],
    },
    primaryType: "Mail",
    domain: {
      name: "NFT Box",
      version: "1",
      chainId: 5,
      verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
    },
    message: {
      from: {
        name: "Cow",
        wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
      },
      to: {
        name: "Bob",
        wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
      },
      contents: "Mint & Transfer",
    },
  };
  const seller = recoverTypedSignature({
    data: typedData as any,
    signature: sellerSignature,
    version: SignTypedDataVersion.V4,
  });

  const buyer = recoverTypedSignature({
    data: typedData as any,
    signature: buyerSignature,
    version: SignTypedDataVersion.V4,
  });

  console.log("seller : ", seller);
  console.log("buyer : ", buyer);
  const test2 = await contract.methods.getSet().call();
  console.log("test : ", test);
  console.log("test2 : ", test2);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
