const struct = require('python-struct');
const { Buffer }  = require('buffer');
const _ = require('lodash');

const LOCATION_ENUM = ['internal', 'external'];
const MODE_ENUM = ['MONO', 'POLY', 'LOOP', 'STOP', 'TMP', 'CLK', 'HAT'];

const PAD_FORMAT = [
  "KITI",
  [0x01, 0x00, 0x00],
  {
    "name": "sample_location",
    "type": "enum",
    "enum": LOCATION_ENUM,
  },
  Array(7).fill(0),
  {
    "name": "sample_name_length",
    "type": "int8",
  },
  {
    "name": "sample_name",
    "type": "string",
    "length": 8,
  },
  Array(9).fill(0),
  {
    "name": "pan",
    "type": "int8",
  },
  {
    "skip_validation": true,
    "expected": [
      0x00, 0x11, 0x00, 0x09, 0x00, 0x00, 0x00, 0x08,
      0x00, 0x0A, 0x01, 0x00, 0x04, 0x08, 0x02, 0x00,
      0x04, 0x08, 0x03
    ],
  },
  {
    "name": "reverb",
    "type": "int8",
  },
  [0x00],
  {
    "name": "tune",
    "type": "int8",
  },
  {
    "name": "level",
    "type": "int8",
  },
  {
    "name": "midi_channel",
    "type": "int8",
  },
  {
    "name": "velocity_min",
    "type": "int8",
  },
  {
    "name": "velocity_max",
    "type": "int8",
  },
  [0x09],
  {
    "name": "mode",
    "type": "enum",
    "enum": MODE_ENUM,
  },
  [0x00, 0x05, 0x0C],
  {
    "name": "sensitivity",
    "type": "int8"
  },
  {
    "skip_validation": true,
    "expected": [
      0x00, 0x08, 0x0D, 0x00,
      0x00, 0x09, 0x0E,
    ],
  },
  {
    "name": "mute_group",
    "type": "int8",
  },
  [0x00, 0x10],
  Array(52).fill(0),
  {
    "name": "unknown_sample_1_parameter_1",
    "type": "int8",
  },
  {
    "name": "unknown_sample_1_parameter_2",
    "type": "int8",
  },
  {
    "name": "sample_1_velocity_min",
    "type": "int8",
  },
  {
    "name": "sample_1_velocity_max",
    "type": "int8",
  },
  Array(3).fill(0),
  {
    "name": "sample_1_filename_length",
    "type": "int8",
  },
  {
    "name": "sample_1_filename",
    "type": "string",
    "length": 8,
    "space_pad": true,
  },
  {
    "name": "sample_1_human_filename",
    "type": "string",
    "length": 8,
  },
  Array(8).fill(0),
  {
    "name": "unknown_sample_2_parameter_1",
    "type": "int8",
  },
  {
    "name": "unknown_sample_2_parameter_2",
    "type": "int8",
  },
  {
    "name": "sample_2_velocity_min",
    "type": "int8",
  },
  {
    "name": "sample_2_velocity_max",
    "type": "int8",
  },
  Array(3).fill(0),
  {
    "name": "sample_2_filename_length",
    "type": "int8",
  },
  {
    "name": "sample_2_filename",
    "type": "string",
    "length": 8,
    "space_pad": true,
  },
  {
    "name": "sample_2_human_filename",
    "type": "string",
    "length": 8,
  },
  Array(72).fill(0)
];

// Objects in FORMAT can:
//  - contain an "expected" value
//  - contain a "name" and "type" (and optional "decoder" and "encoder")
//  - contain a "repeat" and "format"
const FORMAT_LENGTH = 8832;
const FORMAT = [
  "KITH",
  [0x00, 0x80, 0x00, 0x00],
  {
    "name": "checksum",
    "type": "int8",
  },
  [0x00, 0x00],
  {
    "name": "kit_index",
    "type": "int8",
  },
  Array(59).fill(0),
  {
    "name": "title_length",
    "type": "int8",
  },
  {
    "name": "title",
    "type": "string",
    "length": 8,
  },
  Array(48).fill(0),
  {
    "name": "pads",
    "repeat": 17,
    "length": 256,
    "format": PAD_FORMAT,
  },
  {
    "name": "external_layers",
    "repeat": 17,
    "length": 256,
    "format": PAD_FORMAT,
  }
];

function decode(data, format) {
  var buf = Buffer.from(data);

  var output = {};

  var i = 0;
  for (var formatIndex in format) {
    var obj = format[formatIndex];

    if (typeof obj === 'string' || Array.isArray(obj)) {
      obj = {expected: obj};
    }

    if (obj.expected) {
      var decodedValue = buf.slice(i, i + obj.expected.length);
      var expectedBuffer = Buffer.from(obj.expected);
      if (!expectedBuffer.equals(decodedValue) && !obj.skip_validation) {
        throw `Decoded value for format index ${formatIndex} (bytes ${i} to ${i + obj.expected.length}, ${decodedValue.toString('hex')}) does not match expected (${expectedBuffer.toString('hex')}).`;
      }
      i += obj.expected.length;
    } else if (obj.name && obj.type) {
      switch (obj.type) {
        case 'int8':
          output[obj.name] = buf.readInt8(i);
          i += 1;
          break;
        case 'string':
          var lengthToTruncate = output[obj.name + '_length'] || obj.length;
          output[obj.name] = buf.toString('ascii', i, i + obj.length).substring(0, lengthToTruncate).replace(/\0/g, '');
          i += obj.length;
          break;
        case 'enum':
          output[obj.name] = obj.enum[buf.readInt8(i)];
          i += 1;
          break;
      }
    } else if (obj.name && obj.repeat && obj.format) {
      var subobjects = [];
      for (var j = 0; j < obj.repeat; j++) {
        subobjects.push(decode(buf.slice(i, i + obj.length), obj.format));
        i += obj.length;
      }
      output[obj.name] = subobjects;
    }
  }

  return output;
}

function decodeRoot(data) {
  return decode(data, FORMAT);
}

function encode(data, format, length) {
  var buf = Buffer.alloc(length);

  var i = 0;
  for (var formatIndex in format) {
    var obj = format[formatIndex];

    if (typeof obj === 'string' || Array.isArray(obj)) {
      obj = {expected: obj};
    }

    if (obj.expected) {
      var expectedBuffer = Buffer.from(obj.expected);
      expectedBuffer.copy(buf, i);
      i += expectedBuffer.length;
    } else if (obj.name && obj.type && (obj.name in data)) {
      switch (obj.type) {
        case 'int8':
          buf.writeInt8(data[obj.name], i);
          i += 1;
          break;
        case 'string':
          var tempBuf = Buffer.alloc(obj.length);
          if (obj.space_pad) {
            tempBuf.fill(0x20);
          }
          tempBuf.write(data[obj.name]);
          tempBuf.copy(buf, i);
          i += obj.length;
          break;
        case 'enum':
          var value = _.findKey(obj.enum, data[obj.name]) || obj.enum.indexOf(data[obj.name]);
          buf.writeInt8(value, i);
          i += 1;
          break;
      }
    } else if (obj.name && obj.repeat && obj.format) {
      for (var j = 0; j < obj.repeat; j++) {
        var subBuf = encode(data[obj.name][j], obj.format, obj.length);
        subBuf.copy(buf, i, 0);
        i += obj.length;
      }
    }
  }

  return buf;
}

function calculateChecksum(buf) {
  var checksum = 0;
  for(var i = 9; i < buf.length; i++) {
    checksum = checksum + buf.readInt8(i) & 0xff;
    checksum = checksum & 0xff;
  }
  // Convert to signed 8-bit int
  if (checksum > 127) {
    checksum -= 128;
  }
  return checksum;
}

function encodeRoot(data) {
  var buf = encode(data, FORMAT, FORMAT_LENGTH);
  // Calculate checksum, gets saved to byte 8
  var checksum = calculateChecksum(buf);
  console.log("Writing checksum " + checksum);
  buf.writeInt8(checksum, 8);
  return buf;
}

module.exports = {
  decode: decodeRoot,
  encode: encodeRoot,
  calculateChecksum: calculateChecksum,
};
