const config = require('../config');

const fs = require('fs');
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

exports.get = (str) => {
    const type = config.getSetting().language;
    if (records[str]) {
        const typeStr = (records[str])[type];
        if (typeStr && typeStr.length > 0) {
            return typeStr;
        }
        else {
            return (records[str])["English"];
        }
    }
    else {
        return str;
    }
}