import {get, put} from "./lib/db.js";
import {updateUI} from "./lib/ui.js";
import {publish} from "./lib/event.js";

export async function showUI() {
    let counter = (await get("counter")) || 0;
    updateUI([
        ["h1", {}, `Counter ${counter}`],
        ["button", {"onclick": "inc"}, "++"],
        ["button", {"onclick": "dec"}, "--"]
    ]);
}

export async function inc() {
    let counter = (await get("counter")) || 0;
    counter++;
    await put("counter", counter);
    await publish("load");
}

export async function dec() {
    let counter = (await get("counter")) || 0;
    counter--;
    await put("counter", counter);
    await publish("load");
}