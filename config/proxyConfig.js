const USE_PROXY = false;
const PROXY_CONFIG = 'http://127.0.0.1:10809';
proxyConfig = {
    enabled:USE_PROXY,
    proxy:PROXY_CONFIG,
    config:USE_PROXY?PROXY_CONFIG:null
};
module.exports = proxyConfig;
