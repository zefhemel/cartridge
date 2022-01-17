export default {
    'event.publish': (ctx, name, data) => {
        ctx.cartridge.dispatchEvent(name, data);
    }
};