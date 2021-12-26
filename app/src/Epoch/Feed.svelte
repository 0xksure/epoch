<script lang="ts">
  import FeedItem from "./FeedItem.svelte";
  import { messages } from "src/stores/messages";

  const msgs = messages;
  msgs.load();
</script>

<div class="feed">
  <FeedItem
    item={{
      user: { username: "kristohb", walletAddress: "38293iujwhdhio" },
      message: "thios is cool",
    }}
  />
</div>

<style>
  .feed {
  }
</style>
