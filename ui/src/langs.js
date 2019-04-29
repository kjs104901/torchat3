const { remote } = require('electron');

const fs = remote.require('fs');
const parse = require('csv-parse/lib/sync')

const input = fs.readFileSync('./languages.csv');
const tempRecords = parse(input, { columns: true })

const records = {};
tempRecords.forEach((record) => {
    const defaultValue = record["Default"];
    records[defaultValue] = record;
});

const types = ["English", "Korean"];
exports.types = types;

let type = "English";
exports.selectType = (newType) => { this.type = newType; }

exports.trans = (str) => {
    let resultStr = "";
    if (records[str]) {
        const typeStr = (records[str])[type];
        if (typeStr && typeStr.length > 0) {
            resultStr = typeStr;
        }
        else {
            resultStr = (records[str])["Default"];
        }
    }
    return resultStr;
}