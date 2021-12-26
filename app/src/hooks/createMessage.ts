import * as anchor from "@project-serum/anchor";


export async function createMessage(program: anchor.Program<anchor.Idl>, message: string) {
    const messageAccount = anchor.web3.Keypair.generate()
    await program.rpc.send_message(message, {
        accounts: {
            message: messageAccount.publicKey,
            user: window.solana.publicKey.toString(),
            systemProgram: anchor.web3.SystemProgram.programId
        },
        signers: [messageAccount]
    })
}