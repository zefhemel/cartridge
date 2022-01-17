// Run with: deno run --allow-read --allow-net deno.ts
import {FunctionWorker} from "./runtime.js";

const f = new FunctionWorker("./function.js");
await f.invoke({name: "Zef"});
f.stop();
