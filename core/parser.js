const xss = require("xss");
const xssFilters = require('xss-filters');
const constant = require('../constant');

exports.buffer = (dataBuffer) => {
    const newLinePos = dataBuffer.indexOf('\n');
    const dataStr = dataBuffer.substring(0, newLinePos);
    dataBuffer = dataBuffer.substr(newLinePos + 1);
    const dataList = dataStr.split(" ");

    return {
        dataList: dataList,
        leftBuffer: dataBuffer
    }
}

function replaceAll(str, searchStr, replaceStr) {
    return str.split(searchStr).join(replaceStr);
}

function escape(targetStr) {
    targetStr = replaceAll(targetStr, '\r', '');

    targetStr = replaceAll(targetStr, '\\', '\\/');
    targetStr = replaceAll(targetStr, ' ', '\\s');
    targetStr = replaceAll(targetStr, '\n', '\\n');
    return targetStr;
}
exports.escape = escape;

function unescape(targetStr) {
    targetStr = replaceAll(targetStr, '\\n', '\n');
    targetStr = replaceAll(targetStr, '\\s', ' ');
    targetStr = replaceAll(targetStr, '\\/', '\\');

    targetStr = replaceAll(targetStr, '\r', '');
    return targetStr;
}
exports.unescape = unescape;

function removeNewline(targetStr) {
    targetStr = replaceAll(targetStr, '\\n', '\n');
    return targetStr;
}
exports.removeNewline = removeNewline;

function limitateLength(targetStr, limit) {
    if (targetStr.length > limit) {
        targetStr = targetStr.substr(0, limit);
    }
    return targetStr
}
exports.limitateLength = limitateLength

function isOnlyAscii(targetStr) {
    return (/^[\x00-\xFF]*$/).test(targetStr);
}
exports.isOnlyAscii = isOnlyAscii;

function letOnlyAscii(targetStr) {
    return targetStr.replace(/[^\x00-\xFF]/g, "");
}
exports.letOnlyAscii = letOnlyAscii;

function preventXSS(str) {
    str = str.toString('utf8');
    return xssFilters.inHTMLData(xss(str));
}
exports.preventXSS = preventXSS;

function findStringBetween(str, a, b) {
    if (temp = findStringAfter(str, a)) {
        if (temp = findStringBefore(temp, b)) {
            return temp;
        }
    }
}
exports.findStringBetween = findStringBetween;

function findStringAfter(str, a) {
    let s = str.indexOf(a);
    if (s > -1) {
        s += a.length;
        return str.substring(s);
    }
}
exports.findStringAfter = findStringAfter;

function findStringBefore(str, b) {
    let e = str.indexOf(b);
    if (e > -1) {
        return str.substring(0, e);
    }
}
exports.findStringBefore = findStringBefore;


function normalizeHostname(hostname) {
    hostname = hostname.toLowerCase();
    if (hostname.indexOf('tc3:') == 0) { return hostname.substr('tc3:'.length); }
    return hostname;
}
exports.normalizeHostname = normalizeHostname;

function checkHostname(hostname) {
    let valid = true;
    hostname = normalizeHostname(hostname);
    if (constant.HiddenServiceVersion == 3) {
        if (hostname.length != 56) { return false; }
    }
    else if (constant.HiddenServiceVersion == 2) {
        if (hostname.length != 16) { return false; }
    }
    hostname.split('').forEach(char => {
        if (!char.match(/[0-9]|[a-z]/)) { valid = false; }
    });
    return valid;
}
exports.checkHostname = checkHostname;