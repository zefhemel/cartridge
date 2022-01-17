class SyscallContext {
    constructor(cartridge) {
        this.cartridge = cartridge;
    }
}

export class Runtime {
    constructor() {
        this.registeredSyscalls = {};
    }

    /**
     * Registers one or multiple syscalls with associated callbacks, each callback will be invoked with a SyscallContext first
     * @param registrationObject mapping name to callbacks
     */
    registerSyscalls(...registrationObjects) {
        for(const registrationObject of registrationObjects) {
            for (let p in registrationObject) {
                this.registeredSyscalls[p] = registrationObject[p];
            }
        }
    }

    /**
     * Invoke a syscall by name
     * @param ctx SyscallContext
     * @param name name of syscall
     * @param args array of arguments to pass to syscall
     * @returns {Promise<unknown>}
     */
    async syscall(ctx, name, args) {
        const callback = this.registeredSyscalls[name];
        if (!name) {
            throw Error(`Unregistered syscall ${name}`);
        }
        return Promise.resolve(callback(ctx, ...args));
    }
}

export class FunctionWorker {
    constructor(cartridge, url, path) {
        this.worker = new Worker(
            new URL("./worker.js", import.meta.url).href,
            {type: "module"}
        );
        this.worker.onmessage = this.onmessage.bind(this);
        this.worker.postMessage({
            type: 'boot',
            path: `${url}/${path}`
        });
        this.inited = new Promise((resolve, reject) => {
            this.initCallback = resolve;
        });
        this.cartridge = cartridge;
        this.runtime = cartridge.runtime;
    }

    async onmessage(evt) {
        let data = evt.data;
        if (!data) return;
        switch (data.type) {
            case "inited":
                this.initCallback();
                break;
            case "syscall":
                const ctx = new SyscallContext(this.cartridge);
                let result = await this.runtime.syscall(ctx, data.name, data.args);

                this.worker.postMessage({
                    type: "syscall-response",
                    id: data.id,
                    data: result,
                });
                break;
            case "done":
                this.invokeCallback();
                break;
            default:
                console.error("Unknown message type", data);
        }
    }

    async invoke(data) {
        await this.inited;
        this.worker.postMessage({
            type: "invoke",
            data: data,
        });
        return new Promise((resolve, reject) => {
            this.invokeCallback = resolve;
        });
    }

    stop() {
        this.worker.terminate();
    }
}

export class Cartridge {
    constructor(runtime, url) {
        this.url = url;
        this.runtime = runtime;
        this.runningFunctions = {};
    }

    async load() {
        let manifestRequest = await fetch(`${this.url}/app.json`)
        let manifestJson = await manifestRequest.json();
        this.manifest = manifestJson;
    }

    async invoke(name, data) {
        if (!this.runningFunctions[name]) {
            this.runningFunctions[name] = new FunctionWorker(this, this.url, name);
        }
        await this.runningFunctions[name].invoke(data);
        // f.stop();
    }

    async dispatchEvent(name, data) {
        let functionsToSpawn = this.manifest.events[name];
        if (functionsToSpawn) {
            await Promise.all(functionsToSpawn.map(async functionToSpawn => {
                await this.invoke(functionToSpawn, data);
            }));
        }
    }

    start() {
        this.dispatchEvent('load');
    }
}


console.log("Starting");