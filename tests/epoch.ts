import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Epoch } from '../target/types/epoch';
const assert = require("assert");
import * as bs58 from "bs58";

type EpochProgram = Program<Epoch>
const { SystemProgram } = anchor.web3;

async function createUser(program: EpochProgram, userAccount: anchor.web3.Keypair, provider: anchor.Provider): Promise<void> {
  await program.rpc.createUser({
    accounts: {
      userAccount: userAccount.publicKey,
      authority: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    },
    signers: [userAccount],
  });
}
async function createMessage(program: EpochProgram, messageAccount: anchor.web3.Keypair, provider: anchor.Provider): Promise<void> {
  await program.rpc.sendMessage("cool", {
    accounts: {
      messageAccount: messageAccount.publicKey,
      author: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    },
    signers: [messageAccount],
  })
}


describe('epoch', () => {
  const provider = anchor.Provider.env()
  // Configure the client to use the local cluster.
  anchor.setProvider(provider);
  const program = anchor.workspace.Epoch as EpochProgram;

  it("create user", async () => {

    const newUserAccount = anchor.web3.Keypair.generate();
    // create the user account 
    await createUser(program, newUserAccount, provider)

    let userAccount = await program.account.user.fetch(newUserAccount.publicKey);
    assert.ok(userAccount.authority.equals(provider.wallet.publicKey))
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

    // filter on publickey of author
    const data = await program.account.message.all([
      {
        memcmp: {
          offset: 8, // Discriminator.
          bytes: provider.wallet.publicKey.toBase58(),
        },
      }
    ])
    assert.equal(data.length, 1);


  })
  it("follow account", async () => {
    const followingTrackerAccount = anchor.web3.Keypair.generate();
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
  })
  it("vote on a message", async () => {
    // create a new message 
    const newMessageAccount = anchor.web3.Keypair.generate()
    await createMessage(program, newMessageAccount, provider)

    const newUpVoteAccount = anchor.web3.Keypair.generate()
    await program.rpc.upVote(newMessageAccount.publicKey, {
      accounts: {
        account: newUpVoteAccount.publicKey,
        signer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId
      },
      signers: [newUpVoteAccount]
    })

    // get up voted account 
    const data = await program.account.voteAccount.all([
      {
        memcmp: {
          offset: 8,
          bytes: newMessageAccount.publicKey.toBase58()
        }
      }
    ])
    assert.equal(data.length, 1)
    console.log("data: ", data)
    const voteAccount = data[0]
    // down vote the same post 
    await program.rpc.downVote({
      accounts: {
        account: voteAccount.publicKey,
        voter: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      }
    })

  })
})