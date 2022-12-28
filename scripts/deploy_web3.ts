var Web3 = require("web3");
var web3 = new Web3(process.env.EC2_NETWORK);
import { AbiItem } from "web3-utils";
import Lock from "../artifacts/contracts/Lock.sol/Lock.json";
require("dotenv").config();

const admin = web3.eth.accounts.privateKeyToAccount(process.env.GOERLI_ADMIN!);
const owner = web3.eth.accounts.privateKeyToAccount(process.env.GOERLI_OWNER!);
const privKey = process.env.GOERLI_OWNER;

web3.eth
  .getBalance(owner.address)
  .then((result: any) => console.log("result : ", result));

async function main() {
  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  const unlockTime = currentTimestampInSeconds + ONE_YEAR_IN_SECS;

  const lock = await new web3.eth.Contract(Lock.abi as AbiItem[]);
  console.log("1");

  const lockTx = await lock.deploy({
    data: Lock.bytecode,
  });

  const signTx = await web3.eth.accounts.signTransaction(
    {
      from: owner.address,
      data: lockTx.encodeABI(),
      gas: "6721975",
    },
    privKey!
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
