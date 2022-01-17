import {syscall} from "./syscall.js";

export async function put(key, value) {
  return await syscall("db.put", key, value);
}

export async function get(key) {
  return await syscall("db.get", key);
}
