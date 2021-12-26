<script lang="ts">
  import Header from "./Header.svelte";
  import Epoch from "./Epoch/Epoch.svelte";
  import Front from "./Front.svelte";
  import { connect } from "./stores/connect";

  let isConnected = false;
</script>

<main>
  <Header />
  {#if $connect.isConnected}
    <Epoch />
  {:else}
    <Front />
  {/if}
</main>

<style>
  :root {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }

  .space {
    min-height: 100%;
  }
  .space-main-text {
    margin-top: 10rem;
  }

  main {
    text-align: center;
  }
</style>
