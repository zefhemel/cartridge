import {Cartridge, Runtime} from "./runtime.ts";
import {Manifest} from "./types.d.ts";
import eventSyscalls from "./syscalls/event.native.ts";
import dbSyscalls from "./syscalls/db.localstorage.ts";
import uiSyscalls from "./syscalls/ui.browser.ts";

let runtime = new Runtime();
runtime.registerSyscalls(eventSyscalls, dbSyscalls, uiSyscalls);
let mainCartridge = new Cartridge(runtime, "cartridges", "app");
// Massive ui.browser hack
// @ts-ignore
window.mainCartridge = mainCartridge;

async function pollServiceWorkerActive() {
    for (let i = 0; i < 25; i++) {
        try {
            let ping = await fetch("/cartridges/$ping");
            if (ping.status === 200) {
                return;
            }
        } catch (e) {
            console.log("Not yet");
        }
        await sleep(100);
    }
    // Alright, something's messed up — reload
    // location.reload();
    throw new Error("Worker not successfully activated");
}

function sleep(ms: number): Promise<void> {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

window.addEventListener("load", () => {
    // @ts-ignore
    navigator.serviceWorker.register("./serviceworker.js").then(async (reg) => {
        console.log("Registration succeeded. Scope is ", reg);
    }).catch((e: Error) => {
        console.error("Registration failed", e);
    }).then(async () => {
        await pollServiceWorkerActive();
        console.log("Service worker fully activated, now loading cartridge...");
        let manifestReq = await fetch("/app.json");
        await mainCartridge.load(await manifestReq.json() as Manifest);
        await mainCartridge.start();
    }).catch((e: Error) => {
        console.error("Error initializing", e);
    });
});
