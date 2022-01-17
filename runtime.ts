import {Manifest} from "./types.d.ts";

export class SyscallContext {
    public cartridge: Cartridge;

    constructor(cartridge: Cartridge) {
        this.cartridge = cartridge;
    }
}

interface SysCallMapping {
    // TODO: Better typing
    [key: string]: any;
}

export class Runtime {
    registeredSyscalls: SysCallMapping;

    constructor() {
        this.registeredSyscalls = {};
    }

    registerSyscalls(...registrationObjects: Array<SysCallMapping>) {
        for (const registrationObject of registrationObjects) {
            for (let p in registrationObject) {
                this.registeredSyscalls[p] = registrationObject[p];
            }
        }
    }

    async syscall(
        ctx: SyscallContext,
        name: string,
        args: Array<any>,
    ): Promise<any> {
        const callback = this.registeredSyscalls[name];
        if (!name) {
            throw Error(`Unregistered syscall ${name}`);
        }
        return Promise.resolve(callback(ctx, ...args));
    }
}

export class FunctionWorker {
    private worker: Worker;
    private inited: Promise<any>;
    private initCallback: any;
    private invokeCallback: any;
    private cartridge: Cartridge;
    private runtime: any;

    constructor(cartridge: Cartridge, url: string, name: string) {
        let workerUrl = "./worker.js";
        // @ts-ignore
        if (!navigator.userAgent) {
            // Deno
            workerUrl = new URL(workerUrl, import.meta.url).href;
        }
        this.worker = new Worker(
            workerUrl,
            {type: "module"},
        );
        this.worker.onmessage = this.onmessage.bind(this);
        this.worker.postMessage({
            type: "boot",
            prefix: url,
            name: name,
            // @ts-ignore
            userAgent: navigator.userAgent,
        });
        this.inited = new Promise((resolve, reject) => {
            this.initCallback = resolve;
        });
        this.cartridge = cartridge;
        this.runtime = cartridge.runtime;
    }

    async onmessage(evt: MessageEvent) {
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

    async invoke(args: Array<any>): Promise<any> {
        await this.inited;
        this.worker.postMessage({
            type: "invoke",
            args: args,
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
    url: string;
    runtime: Runtime;

    private runningFunctions: { [key: string]: FunctionWorker };
    private manifest: Manifest;

    constructor(runtime: Runtime, url: string, name: string) {
        this.url = `${url}/${name}`;
        this.runtime = runtime;
        this.runningFunctions = {};
    }

    async load(manifest: Manifest) {
        this.manifest = manifest;
        await fetch(this.url, {
            method: "PUT",
            body: JSON.stringify(manifest),
        });
    }

    async invoke(name: string, args: Array<any>): Promise<any> {
        if (!this.runningFunctions[name]) {
            this.runningFunctions[name] = new FunctionWorker(this, this.url, name);
        }
        await this.runningFunctions[name].invoke(args);
        // f.stop();
    }

    async dispatchEvent(name: string, data?: any) {
        let functionsToSpawn = this.manifest.events[name];
        if (functionsToSpawn) {
            await Promise.all(
                functionsToSpawn.map(async (functionToSpawn: string) => {
                    await this.invoke(functionToSpawn, [data]);
                }),
            );
        }
    }

    start() {
        this.dispatchEvent("load");
    }
}

console.log("Starting");
