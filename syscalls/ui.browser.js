let frameTest = document.getElementById('main-frame');

window.addEventListener('message', async(event) => {
    let data = event.data;
    if (data.type === 'iframe_event') {
        // console.log("Received event in main window", data);
        window.mainCartridge.dispatchEvent(data.data.event, data.data.attributes);
    }
})

export default {
    "ui.update": function (ctx, doc) {
        frameTest.contentWindow.postMessage({
            type: 'loadContent',
            doc: doc
        });
    }
};