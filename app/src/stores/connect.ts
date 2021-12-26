import { writable } from "svelte/store";
import { connectProgram } from "src/hooks/connectProgram"

interface ConnectToWallet {
    isConnected: boolean,
    error: string
}

function connectToWallet() {
    const { subscribe, set, update } = writable({
        isConnected: false,
        program: null,
        error: ""
    })

    return {
        subscribe,
        connect: async () => {
            try {
                await window.solana.connect();
                if (window.solana.isConnected) {
                    const program = await connectProgram()
                    set({ isConnected: true, program, error: "" })
                }

            } catch (e) {
                const errorMessage = "failed to connect";
                set({ isConnected: false, program: null, error: errorMessage })
            }
        }
    }
}

export const connect = connectToWallet()