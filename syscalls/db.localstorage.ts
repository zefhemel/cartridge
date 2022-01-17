import {SyscallContext} from "../runtime.ts";

export default {
    "db.put": (ctx : SyscallContext, key : string, value : any) => {
        localStorage.setItem(key, value);
    },
    "db.get": (ctx : SyscallContext, key : string) => {
        return localStorage.getItem(key);
    },
};
