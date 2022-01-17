import {syscall} from "./syscall.js";

export async function publish(event) {
    return await syscall("event.publish", event);
}