import {syscall} from "./syscall.js";

export async function updateUI(doc) {
    return await syscall("ui.update", doc);
}