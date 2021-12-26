<script lang="ts">
  import Message from "./Message.svelte";
  import Feed from "./Feed.svelte";
</script>

<div class="epoch">
  <Message />
  <Feed />
</div>

<style>
  .epoch {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 2rem;
  }
</style>
