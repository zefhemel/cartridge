export default {
    'db.put': (ctx, key, value) => {
        localStorage.setItem(key, value);
        return true;
    },
    'db.get': (ctx, key) => {
        return localStorage.getItem(key);
    },
};
