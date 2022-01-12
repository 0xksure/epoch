import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Epoch } from '../target/types/epoch';
const assert = require("assert");
import * as bs58 from "bs58";

type EpochProgram = Program<Epoch>
const { SystemProgram } = anchor.web3;

async function createUser(program: EpochProgram, provider: anchor.Provider): Promise<anchor.web3.PublicKey> {
  const [userAccount, bump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("epoch"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

  await program.rpc.createUserAccount(bump, {
    accounts: {
      userAccount: userAccount,
      authority: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    },
  });

  return userAccount
}
async function createMessage(program: EpochProgram, provider: anchor.Provider, message: string, userAccount: anchor.web3.PublicKey, number: number): Promise<anchor.web3.PublicKey> {
  const [messageAccount, bump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("epoch"),
        userAccount.toBuffer(),
        new anchor.BN(number).toArrayLike(Buffer)
      ],
      program.programId
    );

  await program.rpc.sendMessage(message, bump, {
    accounts: {
      userAccount: userAccount,
      messageAccount: messageAccount,
      authority: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    },
  })
  return messageAccount
}


async function getUserAccount(program: EpochProgram, provider: anchor.Provider): Promise<[anchor.web3.PublicKey, number]> {
  const [userAccount, bump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("epoch"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );
  return [userAccount, bump]
}




describe('epoch', () => {
  const provider = anchor.Provider.env()
  // Configure the client to use the local cluster.
  anchor.setProvider(provider);
  const program = anchor.workspace.Epoch as EpochProgram;

  it("create user", async () => {
    // create the user account 
    const [userAccount, bump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("epoch"), provider.wallet.publicKey.toBuffer()],
        program.programId
      );

    await program.rpc.createUserAccount(bump, {
      accounts: {
        userAccount: userAccount,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
    })
    await program.rpc.updateUserAccount("name3", {
      accounts: {
        userAccount: userAccount,
      }
    })

    await program.rpc.updateUserAccount("name2", {
      accounts: {
        userAccount: userAccount,
      }
    })
    const message = "hello"
    const [messageAccount, messageAccountBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("epoch"),
          provider.wallet.publicKey.toBuffer(),
          Buffer.from(message)
        ],
        program.programId
      );

    await program.rpc.sendMessage(message, messageAccountBump, {
      accounts: {
        userAccount: userAccount,
        messageAccount: messageAccount,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
    })
  })
  it.skip("update user account", async () => {
    const [userAccount, bump] = await getUserAccount(program, provider)
    const newUserName = "My name 1"
    await program.rpc.updateUserAccount("a name", {
      accounts: {
        userAccount: userAccount,
      }
    })
    let userAccountInformation = await program.account.user.fetch(userAccount);
    console.log(userAccountInformation.name)
    assert.ok(userAccountInformation.name === newUserName)

  }),
    it.skip("write message", async () => {
      const [userAccount,] = await getUserAccount(program, provider)
      // write message
      console.log("userAccoutn: ", userAccount)
      const userAccountData = await program.account.user.fetch(userAccount);
      console.log("userAccountData: ", userAccountData)
      const [messageAccount, bump] =
        await anchor.web3.PublicKey.findProgramAddress(
          [
            Buffer.from("epoch"),
            userAccount.toBuffer(),
            //new anchor.BN(0).toArrayLike(Buffer)
          ],
          program.programId
        );

      await program.rpc.sendMessage(bump, {
        accounts: {
          messageAccount: messageAccount,
          userAccount: userAccount,
          authority: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
      })

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
  it.skip("follow account", async () => {
    const followingTrackerAccount = anchor.web3.Keypair.generate();
    const accountToFollow = anchor.web3.Keypair.generate();
    await createUser(program, accountToFollow, provider)

    const following = await program.rpc.followUser(accountToFollow.publicKey, {
      accounts: {
        account: followingTrackerAccount.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [followingTrackerAccount],
    })
  })
  it.skip("vote on a message", async () => {
    // create a new message 
    const newMessageAccount = anchor.web3.Keypair.generate()
    await createMessage(program, newMessageAccount, provider)

    const [newVoteAccount, voteAccountBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("epoch"), provider.wallet.publicKey.toBuffer()],
        program.programId
      );
    await program.rpc.upVote(newMessageAccount.publicKey, voteAccountBump, {
      accounts: {
        messageAccount: newMessageAccount.publicKey,
        account: newVoteAccount,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId
      },
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
    // down vote the same post 
    /*await program.rpc.downVote({
      accounts: {
        account: newUpVoteAccount.publicKey,
        voter: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
    })
    */

  })
})