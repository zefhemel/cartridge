import {Cartridge, Runtime} from "./runtime.js";
import eventSyscalls from "./syscalls/event.native.js";
import dbSyscalls from "./syscalls/db.localstorage.js";
import uiSyscalls from "./syscalls/ui.browser.js";

let runtime = new Runtime();
runtime.registerSyscalls(eventSyscalls, dbSyscalls, uiSyscalls);
let mainCartridge = new Cartridge(runtime, 'app');
// Massive ui.browser hack
window.mainCartridge = mainCartridge;

async function pollServiceWorkerActive() {
    for(let i = 0; i < 25; i++) {
        try {
            let ping = await fetch('/$areyouthereyet');
            if(ping.status === 200) {
                return;
            }
        } catch(e) {
            console.log("Not yet");
        }
        await sleep(100);
    }
    // Alright, something's messed up — reload
    location.reload();
    // throw new Error('Worker not successfully activated');
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve()
        }, ms);
    });
}

window.addEventListener('load', () => {
    navigator.serviceWorker.register('./serviceworker.js').then(async reg => {
        console.log('Registration succeeded. Scope is ', reg);
    }).catch((error) => {
        console.error('Registration failed with ' + error);
    }).then(async () => {
        await pollServiceWorkerActive();
        console.log("Service worker fully activated, now loading cartridge...")
        await mainCartridge.load();
        await mainCartridge.start();
    }).catch(e => {
        console.error("Error initializing", e);
    })
});
