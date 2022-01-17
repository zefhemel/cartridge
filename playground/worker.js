self.addEventListener('message', (e) => {
    let {type, path, userAgent} = e.data;

    switch (type) {
        'boot':
            if (userAgent && userAgent.indexOf('Firefox') !== -1) {
                importScripts(path);
                console.log("Loaded");

            } else {
                import(path).then(() => {
                    console.log("Loaded");
                }).catch(e => {
                    console.error(e);
                });
            }
            break;
    }

})
