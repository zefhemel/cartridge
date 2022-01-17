const appRoot = location.origin + '/app';

let cachedBundle;

async function fetchBundle() {
    if (!cachedBundle) {
        let req = await fetch('/test_app.bundle.json');
        cachedBundle = await req.json();
        console.log("Ok, bundle fetched");
    }
    return cachedBundle;
}

self.addEventListener('install', event => {
    console.log("Installing");
    self.skipWaiting();
    event.waitUntil(fetchBundle());
})

self.addEventListener("fetch", event => {
    // console.log("Got fetch", event.request.url);
    if (event.request.url === `${location.origin}/$areyouthereyet`) {
        return event.respondWith(new Response("Yes", {
            status: 200
        }));
    }
    if (event.request.url.startsWith(appRoot)) {
        event.respondWith((async () => {
            let path = event.request.url.substring(appRoot.length+1);
            console.log("Got fetch event", path);

            let bundle = await fetchBundle();
            let data = bundle[path];
            if (data) {
                let response = await fetch(data);
                let blob = await response.blob();
                return new Response(blob, {
                    status: 200
                })
            } else {
                return new Response("Not found", {
                    status: 404
                });
            }
        })());
    }
});

self.addEventListener('activate', event => {
    console.log("Now ready to pick up fetches");
    event.waitUntil(self.clients.claim());
});


console.log("I'm a service worker, look at me!", location.href);
