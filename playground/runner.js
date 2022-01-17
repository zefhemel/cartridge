console.log("Starting");
let worker = new Worker(
    new URL("./worker.js", import.meta.url).href,
    {type: "module"}
);
worker.onmessage = (e) => {
    console.log("Got message from worker");
}
worker.postMessage({
    type: 'boot',
    path: './function.bundle.js',
    userAgent: navigator.userAgent
});
