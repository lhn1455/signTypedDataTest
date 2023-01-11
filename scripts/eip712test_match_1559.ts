import Web3 from "web3";
import { AbiItem } from "web3-utils";
import hre from "hardhat";
import { Common, Chain } from "@ethereumjs/common";
import EIP712_match from "../artifacts/contracts/EIP712_match.sol/EIP712_match.json";
import { Transaction, FeeMarketEIP1559Transaction } from "@ethereumjs/tx";
import {
  SignTypedDataVersion,
  recoverTypedSignature,
} from "@metamask/eth-sig-util";
import { BlockForkEvent } from "@ethersproject/abstract-provider";

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

  const Seller = web3.eth.accounts.privateKeyToAccount(networkInfo.accounts[0]); //0x888
  const Buyer = web3.eth.accounts.privateKeyToAccount(networkInfo.accounts[1]); //0xc05
  web3.eth.accounts.wallet.add(Buyer.privateKey);
  web3.eth
    .getBalance(Buyer.address)
    .then((result: any) => console.log("result : ", result));

  const eIP712_match = new web3.eth.Contract(EIP712_match.abi as AbiItem[]);
  // const tx = eIP712_match.deploy({
  //   data: EIP712_match.bytecode,
  // });

  const signTx = await web3.eth.accounts.signTransaction(
    {
      from: Buyer.address,
      data: EIP712_match.bytecode,
      gas: "6721975",
    },
    Buyer.privateKey
  );
  console.log("1");
  const TxReceipt = await web3.eth.sendSignedTransaction(
    signTx.rawTransaction!
  );

  console.log("TxReceipt:", TxReceipt);
  const contractAddress = TxReceipt.contractAddress;
  const contract = new web3.eth.Contract(
    EIP712_match.abi as AbiItem[],
    contractAddress
  );
  const test = await contract.methods.getSet().call();
  const gas = await contract.methods.set(Buyer.address).estimateGas();
  console.log("gas", gas);

  const sellerSignature =
    "0xff421c61889a95d210fdcfeeb15db24bb79a3235b242ec1dbbd76dede79d87e62b423c988bbcbe9a97a886eb7de1a6736e2ab43c9b7e6fc6967e9f641c9ca7431c";

  const buyerSignature =
    "0x2faa6568ab4230395b5ed1fd11c7a82672f046fd522c468ae9d83ae0fb2bd0cc5a14ebbaed5fc2909d50a00307d012f5cad9b475807716495db30df81808144f1b";

  const bytecodeData = await contract.methods
    .executeSetIfSignatureMatch(sellerSignature, buyerSignature)
    .encodeABI();
  console.log(bytecodeData);

  const bytecodeSet = await contract.methods.set(Buyer.address).encodeABI();
  console.log(bytecodeSet);

  const txCount = await web3.eth.getTransactionCount(Buyer.address);
  const txObject = {
    type: "0x02",
    nonce: web3.utils.toHex(txCount),
    from: Buyer.address,
    to: contractAddress,
    gasLimit: web3.utils.toHex(6721975),
    data: bytecodeData,
    value: "0x00",
    //추가
    maxFeePerGas: web3.utils.toHex(200000000000),
    maxPriorityFeePerGas: web3.utils.toHex(20000000000),
  };

  const block = await web3.eth.getBlock("pending");
  // block.baseFeePerGas
  console.log("base : ", block.baseFeePerGas);
  // const maxFee = 2 * block.baseFeePerGas! + maxPriorityFeePerGas;
  const maxPriorityFeePerGas = web3.utils.toHex(
    web3.utils.toWei("1.5", "gwei")
  );
  // const txObject = {$
  //   type: "0x02",
  //   chainId: "0x05",
  //   nonce: web3.utils.toHex(txCount),
  //   from: Buyer.address,
  //   to: contractAddress,
  //   gasLimit: web3.utils.toHex(6721975),
  //   data: bytecodeSet,
  //   value: "0x00",
  //   accessList: [],
  //   maxPriorityFeePerGas: web3.utils.toHex(web3.utils.toWei("1.5", "gwei")),
  //   maxFeePerGas: web3.utils.toHex(web3.utils.toWei("1.5", "gwei")),
  // };

  const txForSign = FeeMarketEIP1559Transaction.fromTxData(txObject, {
    common,
  });

  // const txForSign = new Transaction(txObject, { common });
  const privateKey = Buffer.from(Buyer.privateKey.substring(2), "hex");
  const signedTx = txForSign.sign(privateKey);
  const serializedRawTx = signedTx.serialize().toString("hex");
  // console.log("serializedTx : ", serializedRawTx);

  const receipt = await web3.eth.sendSignedTransaction("0x" + serializedRawTx);
  console.log("receipt : ", receipt);

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
      Order: [
        { name: "from", type: "Person" },
        { name: "to", type: "Person" },
        { name: "contents", type: "string" },
      ],
    },
    primaryType: "Order",
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
