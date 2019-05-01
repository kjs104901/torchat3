exports.buffer = (dataBuffer) => {
    const newLinePos = dataBuffer.indexOf('\n');
    const dataStr = dataBuffer.substring(0, newLinePos);
    dataBuffer = dataBuffer.substr(newLinePos + 1);
    const dataList = dataStr.split(" ");

    return {
        dataList: dataList,
        bufferAfter: dataBuffer
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