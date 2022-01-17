import {walk} from "https://deno.land/std@0.121.0/fs/mod.ts";
import { mime } from "https://deno.land/x/mimetypes@v1.0.0/mod.ts";

async function dataEncodeUint8Array(path : string, data: Uint8Array): Promise<string> {
    const base64url: string = await new Promise((r) => {
        const reader = new FileReader();
        reader.onload = () => r(reader.result as string);
        reader.readAsDataURL(new Blob([data]))
    })
    let [meta, content] = base64url.split(';');
    let [prefix, mimeType] = meta.split(':');
    return `data:${mime.getType(path)};${content}`;
}

async function bundle(path: string): Promise<object> {
    let files: { [key: string]: string } = {};
    for await (const entry of walk(path, {includeDirs: false})) {
        let content = await Deno.readFile(entry.path);
        files[entry.path.substring(path.length + 1)] = await dataEncodeUint8Array(entry.path, content);
    }
    return files;
}

console.log("Updating bundle...");
let b = await bundle("test_app");
await Deno.writeFile("test_app.bundle.json", new TextEncoder().encode(JSON.stringify(b, null, 2)));

const watcher = Deno.watchFs("test_app");

for await (const event of watcher) {
    console.log("Updating bundle...");
    let b = await bundle("test_app");
    await Deno.writeFile("test_app.bundle.json", new TextEncoder().encode(JSON.stringify(b, null, 2)));
}