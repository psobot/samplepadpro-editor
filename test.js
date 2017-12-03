const { decode, encode, calculateChecksum } = require('./app/decoder');
const fs = require('fs');
const _ = require('lodash');

const inData = fs.readFileSync('/dev/stdin');

// console.log(decode(inData));
var output = decode(inData);
_.forEach(output.pads, (pad) => pad.reverb = 0);
_.forEach(output.external_layers, (pad) => pad.reverb = 0);
console.log(output);
fs.writeFileSync("test.kit", encode(output), "binary");
