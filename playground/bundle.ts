let {files} = await Deno.emit("basic.ts", {
    bundle: 'classic',
    check: true
});
let bundleSource = files['deno:///bundle.js'];
let bundleMap = files['deno:///bundle.js.map'];

let modVariable = `basic_mod`;
await Deno.writeFile('function.bundle.js', new TextEncoder().encode(`const ${modVariable} = ${bundleSource}
//# sourceMappingURL=function.bundle.js.map
self.addEventListener('invoke-function', e => {
    ${modVariable}['default']();
});
`));
await Deno.writeFile('function.bundle.js.map', new TextEncoder().encode(bundleMap));