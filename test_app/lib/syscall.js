export function syscall(name, ...args) {
    let reqId = Math.floor(Math.random() * 1000000);
    // console.log("Syscall", name, reqId);
    return new Promise((resolve, reject) => {
        self.dispatchEvent(new CustomEvent('syscall', {
            detail: {
                id: reqId,
                name: name,
                args: args,
                callback: resolve
            }
        }));
    });
}
