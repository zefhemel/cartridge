let func = null;
let pendingRequests : {
    [key: number]: any
} = {};

// @ts-ignore
const postMessage = self.postMessage;

self.addEventListener("syscall", (event) => {
    let customEvent = event as CustomEvent;
    let detail = customEvent.detail;
    pendingRequests[detail.id] = detail.callback;
    postMessage({
        type: "syscall",
        id: detail.id,
        name: detail.name,
        args: detail.args,
    });
});

self.addEventListener("result", (event) => {
    let customEvent = event as CustomEvent;
    postMessage({
        type: "done",
        result: customEvent.detail,
    });
});

function safeRun(fn : () => Promise<void>) {
    fn().catch(e => {
        console.error(e);
    });
}

self.addEventListener('message', event => {
    safeRun(async () => {
        let messageEvent = event as MessageEvent;
        let data = messageEvent.data;
        switch (data.type) {
            case "boot":
                if (data.userAgent && data.userAgent.indexOf("Firefox") !== -1) {
                    // @ts-ignore
                    importScripts(`./${data.prefix}/function/${data.name}`);
                } else {
                    await import(`./${data.prefix}/function/${data.name}`);
                }
                postMessage({
                    type: "inited",
                });
                break;
            case "invoke":
                self.dispatchEvent(
                    new CustomEvent("invoke-function", {
                        detail: {
                            args: data.args || [],
                        },
                    }),
                );
                break;
            case "syscall-response":
                let id = data.id;
                const lookup = pendingRequests[id];
                if (!lookup) {
                    console.log(
                        "Current outstanding requests",
                        pendingRequests,
                        "looking up",
                        id,
                    );
                    throw Error("Invalid request id");
                }
                return await lookup(data.data);
        }
    });

});
