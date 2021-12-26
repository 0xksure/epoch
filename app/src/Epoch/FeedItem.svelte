<script lang="ts">
  import User from "../User.svelte";
  type User = {
    username: string;
    walletAddress: string;
  };
  type Item = {
    user: User;
    message: string;
  };
  export let item: Item;
</script>

<div>
  {#if item}
    <div class="feed-item">
      <div class="feed-item-content">
        <User />
        <div class="feed-item-text">
          <div class="feed-item-user">
            {item.user.username}
            <div class="feed-item-wallet">
              {item.user.walletAddress}
            </div>
          </div>
          <div class="feed-item-message">
            <span>
              {item.message}
            </span>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .feed-item {
    width: 450px;
    height: 100px;
    border-style: solid;
    border-color: gray;
    border-width: 1px;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    padding: 20px;
    padding-left: 10px;
    padding-right: 10px;
  }
  .feed-item-text {
    flex-direction: row;
    margin-left: 20px;
  }
  .feed-item-content {
    display: flex;
    height: 100%;
  }

  .feed-item-user {
    font-weight: 600;
    color: white;
    margin-bottom: 10px;
    display: flex;
  }

  .feed-item-wallet {
    color: gray;
    font-weight: 400;
  }

  .feed-item-message {
    width: 100%;
    background-color: black;
    color: white;
    text-align: left;
  }
</style>
