import {syscall} from "./syscall.ts";

export async function updateUI(doc: any) {
    return await syscall("ui.update", doc);
}
