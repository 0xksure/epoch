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

  const [account, bump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("epoch"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );
  return [account, bump]
}


async function getMessageAccount(program: EpochProgram, provider: anchor.Provider, message: String): Promise<[anchor.web3.PublicKey, number]> {
  const [account, bump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("epoch"),
        provider.wallet.publicKey.toBuffer(),
        Buffer.from(message)
      ],
      program.programId
    );
  return [account, bump]
}


async function getFollowingAccount(program: EpochProgram, provider: anchor.Provider, userAccount: anchor.web3.PublicKey, userAccountToFollow: anchor.web3.PublicKey): Promise<[anchor.web3.PublicKey, number]> {
  const [account, bump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("epoch"),
        userAccountToFollow.toBuffer(),
        provider.wallet.publicKey.toBuffer(), ,
      ],
      program.programId
    );

  return [account, bump]
}

describe('epoch', () => {
  const provider = anchor.Provider.env()
  // Configure the client to use the local cluster.
  anchor.setProvider(provider);
  const program = anchor.workspace.Epoch as EpochProgram;

  it("create user", async () => {
    // create the user account 
    const [userAccount, bump] = await getUserAccount(program, provider)

    // Create a new user account
    await program.rpc.createUserAccount(bump, {
      accounts: {
        userAccount: userAccount,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
    })

    // Update user account 
    await program.rpc.updateUserAccount("epoch ser", {
      accounts: {
        userAccount: userAccount,
      }
    })
    // Update user account 
    await program.rpc.updateUserAccount("name2", {
      accounts: {
        userAccount: userAccount,
      }
    })
    const message = "hello pdas rule"
    const [messageAccount, messageAccountBump] = await getMessageAccount(program, provider, message)

    // send a message 
    await program.rpc.sendMessage(message, messageAccountBump, {
      accounts: {
        userAccount: userAccount,
        messageAccount: messageAccount,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
    })

    const epochMessages = await program.account.message.all([
      {
        memcmp: {
          offset: 8 + 32 + 4, // Discriminator.
          bytes: bs58.encode(Buffer.from("message")),
        }
      }
    ])

    const firstEpochMessage = epochMessages[0]
    assert.equal(firstEpochMessage.account.content, message)

  })
  it("update user account", async () => {
    const [userAccount, bump] = await getUserAccount(program, provider)
    const newUserName = "epoch ser"
    await program.rpc.updateUserAccount(newUserName, {
      accounts: {
        userAccount: userAccount,
      }
    })
    let userAccountInformation = await program.account.user.fetch(userAccount);
    assert.equal(userAccountInformation.name, newUserName)
  })
  it("write message", async () => {
    const [userAccount,] = await getUserAccount(program, provider)
    // write message
    const newMessage = "hello there degen"
    const [messageAccount, messageAccountBump] = await getMessageAccount(program, provider, newMessage)

    await program.rpc.sendMessage(newMessage, messageAccountBump, {
      accounts: {
        messageAccount: messageAccount,
        userAccount: userAccount,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
    })

    // filter on message type 
    const epochMessages = await program.account.message.all([
      {
        memcmp: {
          offset: 8 + 32 + 4, // Discriminator.
          bytes: bs58.encode(Buffer.from("message")), // search for epoch type
        }
      }
    ])

    const newMessageExists = epochMessages.filter(message => message.account.content === newMessage)
    assert.equal(newMessageExists.length, 1)

    // filter on publickey of author
    const epochMessagesForCreator = await program.account.message.all([
      {
        memcmp: {
          offset: 8, // Discriminator.
          bytes: provider.wallet.publicKey.toBase58(),
        },
      }
    ])

    const epochMessagesForCreatorExists = epochMessagesForCreator.filter(message => message.account.content === newMessage)
    assert.equal(epochMessagesForCreatorExists.length, 1)

  })
  it("follow account", async () => {

    const [userAccountAlice, aliceAccountBump] = await getUserAccount(program, provider)
    const [userAccountBob, bobAccountBump] = await getUserAccount(program, provider)

    const [followingAccount, followingAccountBump] = await getFollowingAccount(program, provider, userAccountAlice, userAccountBob)

    await program.rpc.followUser(userAccountBob, followingAccountBump, {
      accounts: {
        userAccount: userAccountAlice,
        account: followingAccount,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      }
    })

    const accountFollowedByUser = await program.account.following.all([
      {
        memcmp: {
          offset: 8 + 32, // Discriminator.
          bytes: userAccountAlice.toBase58(),
        },
      }
    ])
    console.log("accountFollowedByUser: ", accountFollowedByUser)

  })
})