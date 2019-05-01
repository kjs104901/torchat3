function log() {
    var sum = "";
    for (let i = 0; i < arguments.length; i++) {
        sum += (arguments[i]).toString();
    }
    console.log(sum);
}
exports.log = log;