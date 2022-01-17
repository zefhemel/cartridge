let func = null;
let pendingRequests = {};

self.addEventListener('syscall', e => {
    pendingRequests[e.detail.id] = e.detail.callback;
    self.postMessage({
        type: 'syscall',
        id: e.detail.id,
        name: e.detail.name,
        args: e.detail.args,
    });
});

self.onmessage = async (e) => {
    let data = e.data;
    switch (data.type) {
        case "boot":
            let path = data.path;
            let functionname = 'default';
            if (path.indexOf(':') !== -1) {
                [path, functionname] = path.split(':');
            }
            console.log("Now importing", path)
            let mod = await import(`./${path}`);
            func = mod[functionname];
            if(!func) {
                throw Error(`No such function ${functionname} in module ${path}`);
            }
            self.postMessage({
                type: 'inited'
            });
            break;
        case "invoke":
            let result = await Promise.resolve(func(data.data));
            self.postMessage({
                type: 'done',
                result: result,
            })
            break;
        case 'syscall-response':
            let id = data.id;
            const lookup = pendingRequests[id];
            if (!lookup) {
                console.log("Current outstanding requests", pendingRequests, "looking up", id)
                throw Error("Invalid request id");
            }
            return await lookup(data.data);
    }
};
