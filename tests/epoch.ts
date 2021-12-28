import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Epoch } from '../target/types/epoch';
const assert = require("assert");
import * as bs58 from "bs58";

type EpochProgram = Program<Epoch>
const { SystemProgram } = anchor.web3;

async function createUser(program: EpochProgram, userAccount: anchor.web3.Keypair, provider: anchor.Provider): string {
  const res = await program.rpc.createUser({
    accounts: {
      userAccount: userAccount.publicKey,
      user: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    },
    signers: [userAccount],
  });
  return res
}

describe('epoch', () => {
  const provider = anchor.Provider.env()
  // Configure the client to use the local cluster.
  anchor.setProvider(provider);
  const myAccount = anchor.web3.Keypair.generate();
  const program = anchor.workspace.Epoch as EpochProgram;

  it("create user", async () => {

    const newUserAccount = anchor.web3.Keypair.generate();
    // create the user account 
    await createUser(program, newUserAccount, provider)

    let userAccount = await program.account.user.fetch(newUserAccount.publicKey);

    assert.ok(userAccount.user.equals(provider.wallet.publicKey))
  })
  it("write message", async () => {
    const myAccount = anchor.web3.Keypair.generate();
    // write message
    await program.rpc.sendMessage("cool", {
      accounts: {
        messageAccount: myAccount.publicKey,
        author: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [myAccount],
    })
    const account = await program.account.message.fetch(myAccount.publicKey)
    console.log("author: ", account.author)
    console.log("content: ", account.content)
    console.log("timestamp: ", account.timestamp)
    assert.ok(account.content === "cool")

    // filter on message type 
    const dataMessages = await program.account.message.all([
      {
        memcmp: {
          offset: 8 + 32 + 4, // Discriminator.
          bytes: bs58.encode(Buffer.from('message')),
        }
      }
    ])

    console.log("messages: ", dataMessages)
    // filter on publickey of author
    const data = await program.account.message.all([
      {
        memcmp: {
          offset: 8, // Discriminator.
          bytes: provider.wallet.publicKey.toBase58(),
        },
      }
    ])
    console.log("messages: ", data)
    assert.equal(data.length, 1);


  })
  it("follow account", async () => {
    const followingTrackerAccount = anchor.web3.Keypair.generate();
    const userAccount = anchor.web3.Keypair.generate();
    await createUser(program, userAccount, provider)
    const accountToFollow = anchor.web3.Keypair.generate();
    await createUser(program, accountToFollow, provider)

    const following = await program.rpc.followUser(accountToFollow.publicKey, {
      accounts: {
        account: followingTrackerAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [followingTrackerAccount],
    })
    console.log("following result: ", following)
  })
})