import Web3 from "web3";
import { AbiItem } from "web3-utils";
import hre from "hardhat";
import { Common, Chain } from "@ethereumjs/common";
import EIP712_single from "../artifacts/contracts/EIP712_single.sol/EIP712_single.json";
import {
  SignTypedDataVersion,
  recoverTypedSignature,
} from "@metamask/eth-sig-util";

require("dotenv").config();

async function main() {
  const networkName = hre.network.name;
  const networkInfo = JSON.parse(JSON.stringify(hre.network.config));
  const web3 = new Web3(new Web3.providers.HttpProvider(networkInfo.url));

  let common;

  switch (networkName) {
    case "ec2":
      common = Common.custom({ chainId: 1337 });
      break;

    case "goerli":
      common = new Common({
        chain: Chain.Goerli,
      });
      break;
    default:
      throw new Error("This network is not exist");
      break;
  }

  const admin = web3.eth.accounts.privateKeyToAccount(networkInfo.accounts[0]);
  const team = web3.eth.accounts.privateKeyToAccount(networkInfo.accounts[1]);
  web3.eth.accounts.wallet.add(admin.privateKey);
  web3.eth
    .getBalance(admin.address)
    .then((result: any) => console.log("result : ", result));

  const eIP712_single = await new web3.eth.Contract(
    EIP712_single.abi as AbiItem[]
  );
  const tx = await eIP712_single.deploy({
    data: EIP712_single.bytecode,
  });

  const signTx = await web3.eth.accounts.signTransaction(
    {
      from: admin.address,
      data: tx.encodeABI(),
      gas: "6721975",
    },
    admin.privateKey!
  );
  const TxReceipt = await web3.eth.sendSignedTransaction(
    signTx.rawTransaction!
  );

  console.log("TxReceipt:", TxReceipt);
  const contractAddress = TxReceipt.contractAddress;
  const contract = new web3.eth.Contract(
    EIP712_single.abi as AbiItem[],
    contractAddress
  );
  const test = await contract.methods.getSet().call();
  const signature =
    "0x588ad70801d0009ce4dc2541c9ea810fd1451bd24483ddf7c6127b18a59495c42b9a608f543895f5a401e02118930269fc637e900fcec59460f33859f537f9541b";

  const res = await contract.methods
    .executeSetIfSignatureMatch(signature)
    .send({
      from: admin.address,
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
  const recoverd = recoverTypedSignature({
    data: typedData as any,
    signature: signature,
    version: SignTypedDataVersion.V4,
  });
  console.log("recoverd : ", recoverd);
  const test2 = await contract.methods.getSet().call();
  console.log("test : ", test);
  console.log("test2 : ", test2);
  const ownerof = await contract.methods.ownerOf(1).call();
  console.log("ownerOf: ", ownerof);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
