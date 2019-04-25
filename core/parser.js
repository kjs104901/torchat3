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

function escape (targetStr) {
    targetStr = replaceAll(targetStr, '\\', '\\/');
    targetStr = replaceAll(targetStr, ' ', '\\s');
    targetStr = replaceAll(targetStr, '\n', '\\n');
    return targetStr;
}
exports.escape = escape;

function unescape (targetStr) {
    targetStr = replaceAll(targetStr, '\\n', '\n');
    targetStr = replaceAll(targetStr, '\\s', ' ');
    targetStr = replaceAll(targetStr, '\\/', '\\');
    return targetStr;
}
exports.unescape = unescape;