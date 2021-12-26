import { get, writable } from "svelte/store"
import { fetchMessages } from "src/hooks/fetchMessages"
import { createMessage } from "src/hooks/createMessage";
import { connect } from "src/stores/connect"

function manageMessages() {


    const { subscribe, set } = writable({
        isLoaded: false,
        messages: []
    })

    let connectValue = get(connect);

    return {
        subscribe,
        load: async () => {
            try {
                const res = await fetchMessages(connectValue.program)
                console.log("manageMessages.load.success. res: ", res)
                set({ isLoaded: true, messages: res })
            } catch (e) {
                console.log("manageMessages.load.fail")
                set({ isLoaded: false, messages: [] })
            }
        },
        write: async (message: string) => {
            console.log("manageMessages.write.message. message: ", message)
            const res = createMessage(connectValue.program, message)
            console.log("manageMessages.write.message. res: ", res)
        }
    }
}

export const messages = manageMessages()