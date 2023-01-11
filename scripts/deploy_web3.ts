import Web3 from "web3";
import { AbiItem } from "web3-utils";
import hre from "hardhat";
import { Common, Chain } from "@ethereumjs/common";
import GenesisLock from "../artifacts/contracts/GenesisLock.sol/GenesisLock.json";
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

  const genesisLock = await new web3.eth.Contract(GenesisLock.abi as AbiItem[]);
  console.log("1");

  const lockTx = await genesisLock.deploy({
    data: GenesisLock.bytecode,
  });

  const signTx = await web3.eth.accounts.signTransaction(
    {
      from: admin.address,
      data: lockTx.encodeABI(),
      gas: "6721975",
    },
    admin.privateKey
  );
  const TxReceipt = await web3.eth.sendSignedTransaction(
    signTx.rawTransaction!
  );

  console.log("TxReceipt:", TxReceipt);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
