const basic_mod = (function() {
    function fn() {
        return "Zef";
    }
    function __default() {
        console.log(fn());
    }
    return {
        default: __default
    };
})();

//# sourceMappingURL=function.bundle.js.map
self.addEventListener('invoke-function', e => {
    basic_mod['default']();
});
