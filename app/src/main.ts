import App from './App.svelte'
import { Buffer } from 'buffer';
window.Buffer = Buffer

const app = new App({
  target: document.getElementById('app')
})

export default app
