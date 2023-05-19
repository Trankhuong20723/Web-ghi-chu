window.cookie = function(json) {
    let returnData = {};

    if (json)(document.cookie || '').split(/;/).forEach(($, i, o, z = $.split(/=/))=>returnData[z[0].trim()] = z[1]); else returnData = document.cookie;

    return returnData;
};
cookie.set = (key, value, exdays = 10)=>document.cookie = `${key}=${value};expires=${new Date(Date.now()+(exdays*24*60*60*1000)).toUTCString()};path=/`;
cookie.clear = key=>document.cookie = `${key}=null;expires=${new Date(-1).toUTCString()};path=/`;
window.http = function(url, opt = {}) {
    let head = opt.headers;

    if (!head)head = opt.headers = {};
    if (!head.cookie)head.cookie = cookie();

    opt.headers = new Headers(head);
    return fetch(url, opt);
};
