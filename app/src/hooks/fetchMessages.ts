import type * as anchor from "@project-serum/anchor";

type Message = {

}

export async function fetchMessages(program: anchor.Program<anchor.Idl>) {

    const messages = await program.account.message.all()
    console.log("fetchMessages.messages: ", messages)
    return messages
}