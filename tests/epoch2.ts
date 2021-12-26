import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Epoch2 } from '../target/types/epoch2';
const assert = require("assert");

const { SystemProgram } = anchor.web3;


describe('epoch2', () => {
  const provider = anchor.Provider.env()
  // Configure the client to use the local cluster.
  anchor.setProvider(provider);

  const program = anchor.workspace.Epoch2 as Program<Epoch2>;
  const myAccount = anchor.web3.Keypair.generate();
  it('Is initialized!', async () => {

    // Add your test here.
    const tx = await program.rpc.initialize(provider.wallet.publicKey, {
      accounts: {
        myAccount: myAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [myAccount],
    });

    console.log("Your transaction signature", tx);
  });

  it("write message", async () => {
    // write message
    const tx2 = await program.rpc.writeMessage("cool", {
      accounts: {
        myAccount: myAccount.publicKey,
        authority: provider.wallet.publicKey
      }
    })
    const account = await program.account.myAccount.fetch(myAccount.publicKey)
    console.log("data: ", account.data)
    console.log("messages: ", account.messages)
    assert.ok(account.data === "cool")

  })


});
