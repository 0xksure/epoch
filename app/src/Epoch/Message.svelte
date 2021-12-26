<script lang="ts">
  import User from "../User.svelte";
  import { messages } from "src/stores/messages";

  let epochPost = "gm";
  function onInputChange(event: JSX.FormEventHandler<HTMLDivElement>) {
    epochPost = event.target.value;
  }

  function setPostText(text: string) {
    epochPost = "";
  }
</script>

<div class="new-post">
  <div class="new-post-section">
    <User />
    <div class="text-box">
      <div
        class="text-input"
        role="textbox"
        spellcheck={true}
        contenteditable="true"
        on:change={onInputChange}
        on:focus={() => setPostText("")}
        on:blur={() => setPostText("GM")}
      >
        <span>
          {epochPost}
        </span>
      </div>
    </div>
  </div>
  <div on:submit={() => messages.write("hola")} class="text-box-submit">
    <button class="epoch-main-button">Post</button>
  </div>
</div>

<style>
  .new-post {
    width: 450px;
    height: 100px;
    border-style: solid;
    border-color: gray;
    border-width: 1px;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    margin-bottom: 50px;
  }

  .new-post-section {
    display: flex;
    height: 100%;
  }

  .text-box {
    width: 100%;
    margin-left: 1rem;
    background-color: black;
    display: flex;
    justify-content: center;
  }

  .text-box > .text-input {
    width: 100%;
    height: 100%;
    background-color: black;
    border: none;
    color: gray;
    font-family: epochInput;
    font-size: 32px;
    overflow-wrap: break-word;
    display: flex;
    align-items: flex-start;
  }

  .text-box > .text-input:focus-visible {
    outline: none;
  }

  @font-face {
    font-family: "epochInput";
    src: url("./assets/epochInputFont.ttf") format("truetype");
    font-weight: normal;
    font-style: normal;
  }

  .text-box-submit {
    display: flex;
    flex-direction: row-reverse;
  }

  .epoch-main-button {
    padding: 10px;
    background-color: red;
    color: white;
    border-radius: 10px;
  }
</style>
