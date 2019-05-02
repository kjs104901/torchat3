function log() {
    for (let i = 0; i < arguments.length; i++) {
        process.stdout.write(arguments[i]);
        process.stdout.write(" ");
    }
    process.stdout.write("\n");
}
exports.log = log;