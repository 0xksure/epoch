

export function displayPublicKey() {
    const publicKey = window.solana.publicKey.toString();
    const shortVersionPublicKey = `${publicKey.slice(0, 4)
        }...${publicKey.slice(-4)}`;
    return shortVersionPublicKey
}