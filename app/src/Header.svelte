<script>
  import { displayPublicKey } from "./utils/displayPublickey";
  import { connect } from "./stores/connect";
</script>

<main>
  <div class="container">
    {#if $connect.isConnected}
      <div class="connect-wallet">{displayPublicKey()}</div>
    {:else}
      <button
        class="connect-wallet"
        on:click={async () => {
          await connect.connect();
        }}>Connect</button
      >
    {/if}
    }
  </div>
</main>

<style>
  .container {
    display: flex;
    height: 2rem;
    width: 100%;
  }

  .connect-wallet {
    background-color: red;
    width: 96px;
    height: 24px;
    border-radius: 10px;
    border-style: none;
    position: absolute;
    right: 24px;
    top: 24px;
    color: white;
    cursor: pointer;
  }

  :global(body) {
    background-color: black;
  }
</style>
