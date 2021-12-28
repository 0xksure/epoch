import * as anchor from "@project-serum/anchor";
import { Program, Provider, web3 } from "@project-serum/anchor";
import { Connection } from "@solana/web3.js";
let programID = new anchor.web3.PublicKey(idl.metadata.address);
let opts = {
    preflightCommitment: "processed",
};
import idl from "../../../target/idl/epoch.json";



export async function connectProgram(): Promise<anchor.Program<anchor.Idl>> {
    console.log("connectProgram.start")
    const network = "http://127.0.0.1:8899";
    const connection = new Connection(network, opts.preflightCommitment);

    const provider = new Provider(
        connection,
        window.solana.wallet,
        opts.preflightCommitment
    );
    const program = new Program(idl, programID, provider);
    console.log("connectProgram.program: ", program)
    return program
}
