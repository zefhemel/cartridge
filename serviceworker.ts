import {Manifest} from "./types.d.ts";

const rootUrl = location.origin + "/cartridges";

let loadedBundles: { [key: string]: Manifest } = {};

async function fetchManifest(cartridgeName: string): Manifest {
    if (!loadedBundles[cartridgeName]) {
        let req = await fetch("/test_app.bundle.json");
        loadedBundles[cartridgeName] = await req.json() as Manifest;
        console.log(`Ok, ${cartridgeName} bundle fetched`);
    }
    return loadedBundles[cartridgeName];
}

self.addEventListener("install", (event) => {
    console.log("Installing");
    // @ts-ignore
    self.skipWaiting();
    // event.waitUntil(fetchBundle());
});

async function handlePut(req: Request, path: string) {
    console.log("Got PUT for", path);
    let manifest = await req.json() as Manifest;
    loadedBundles[path] = manifest;
    return new Response("ok");
}

self.addEventListener("fetch", (event: any) => {
    const req = event.request;
    if (req.url.startsWith(rootUrl)) {
        let path = req.url.substring(rootUrl.length + 1);
        event.respondWith((async () => {
            console.log("Got fetch event", path);
            if (path === `$ping`) {
                return new Response("ok");
            }

            if (req.method === "PUT") {
                return await handlePut(req, path);
            }

            let [cartridgeName, resourceType, functionName] = path.split("/");

            let manifest = await fetchManifest(cartridgeName);

            if (!manifest) {
                return new Response(`Cartridge not loaded: ${cartridgeName}`, {
                    status: 404,
                });
            }

            if (resourceType === "$manifest") {
                return new Response(JSON.stringify(manifest));
            }

            if(resourceType === 'function') {
                let func = manifest.functions[functionName];
                if (!func) {
                    return new Response("Not found", {
                        status: 404,
                    });
                }
                return new Response(func.code, {
                    status: 200,
                    headers: {
                        "Content-type": "application/javascript",
                    },
                });
            }
        })());
    }
});

self.addEventListener("activate", (event) => {
    console.log("Now ready to pick up fetches");
    // @ts-ignore
    event.waitUntil(self.clients.claim());
});

console.log("I'm a service worker, look at me!", location.href);
