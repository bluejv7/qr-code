// Only implementing alphanumeric mode and versions 1-4 for now
const VERSIONS = [
    {
        version: 1,
        L: 25,
        M: 20,
        Q: 16,
        H: 10,
    },
    {
        version: 2,
        L: 47,
        M: 38,
        Q: 29,
        H: 20,
    },
    {
        version: 3,
        L: 77,
        M: 61,
        Q: 47,
        H: 35,
    },
    {
        version: 4,
        L: 114,
        M: 90,
        Q: 67,
        H: 50,
    },
];

const ERROR_CORRECTION = [
    {
        version: 1,
        L: {codewords: 19, ecCodewords: 7,  blocks: 1},
        M: {codewords: 16, ecCodewords: 10, blocks: 1},
        Q: {codewords: 13, ecCodewords: 13, blocks: 1},
        H: {codewords: 9,  ecCodewords: 17, blocks: 1},
    },
    {
        version: 2,
        L: {codewords: 34, ecCodewords: 10, blocks: 1},
        M: {codewords: 28, ecCodewords: 16, blocks: 1},
        Q: {codewords: 22, ecCodewords: 22, blocks: 1},
        H: {codewords: 16, ecCodewords: 28, blocks: 1},
    },
    {
        version: 3,
        L: {codewords: 55, ecCodewords: 15, blocks: 1},
        M: {codewords: 44, ecCodewords: 26, blocks: 1},
        Q: {codewords: 34, ecCodewords: 18, blocks: 2},
        H: {codewords: 26, ecCodewords: 22, blocks: 2},
    },
    {
        version: 4,
        L: {codewords: 80, ecCodewords: 20, blocks: 1},
        M: {codewords: 64, ecCodewords: 18, blocks: 2},
        Q: {codewords: 48, ecCodewords: 26, blocks: 2},
        H: {codewords: 36, ecCodewords: 16, blocks: 4},
    },
];

const LENGTH_PAD_BITS = '1110110000010001';

const ALPHANUMERIC_VALUES = {
    0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9,
    A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, G: 16, H: 17, I: 18, J: 19, K: 20, L: 21, M: 22,
    N: 23, O: 24, P: 25, Q: 26, R: 27, S: 28, T: 29, U: 30, V: 31, W: 32, X: 33, Y: 34, Z: 35,
    ' ': 36, '$': 37, '%': 38, '*': 39, '+': 40, '-': 41, '.': 42, '/': 43, ':': 44,
};

const errorCorrection = 'Q';
const phrase = 'HELLO WORLD';
const version = VERSIONS.find(version => {
    return phrase.length <= version[errorCorrection];
});

if (version == null) {
    console.error(`No version fits alphanumeric mode for error correction ${errorCorrection} and phrase ${phrase}`);
    return;
}

// alphanumeric mode for now
const modeIndicator = '0010';

const characterCountIndicator = getCharacterCountIndicator(phrase, version.version);

const encodedPhrase = getEncodedPhrase(phrase);

const requiredBits = ERROR_CORRECTION[version.version - 1][errorCorrection].codewords * 8;

let terminator = '';
let currentBitLength = modeIndicator.length + characterCountIndicator.length + encodedPhrase.length;
if (currentBitLength < requiredBits) {
    terminator = '0'.repeat(Math.min(requiredBits - currentBitLength, 4));
    currentBitLength += terminator.length;
}

let bytePad = '';
const remainder = currentBitLength % 8;
if (remainder != 0) {
    bytePad = '0'.repeat(8 - remainder);
    currentBitLength += bytePad.length;
}

// Note: Bits guaranteed to be multiples of 8 from this point onwards

let lengthPad = '';
if (currentBitLength < requiredBits) {
    lengthPad = pad('', requiredBits - currentBitLength, 'right', LENGTH_PAD_BITS);
}

// TODO: Break data codewords into blocks, if necessary
// Not necessary for us at the moment because versions 1-4 do not have a second group

// Generate Error codes


// alphanumeric mode only for now
function getCharacterCountBitLength(version) {
    if (version <= 9) {
        return 9;
    }
    if (version <= 26) {
        return 11;
    }
    if (version <= 40) {
        return 13;
    }

    throw(`Invalid version ${version} given`);
}

function getCharacterCountIndicator(phrase, version) {
    const bitLength = getCharacterCountBitLength(version)
    return pad(phrase.length.toString(2), bitLength);
}

// alphanumeric mode only for now
function getEncodedPhrase(phrase) {
    let encoded = '';

    // Get pairs
    for (let i = 0; i < phrase.length; i += 2) {
        const pair = phrase.substr(i, 2);
        let number;
        let bits = '';
        if (pair.length == 1) {
            number = ALPHANUMERIC_VALUES[pair[0]];
            bits = pad(number.toString(2), 6);
        } else {
            number = ALPHANUMERIC_VALUES[pair[0]] * 45 + ALPHANUMERIC_VALUES[pair[1]];
            bits = pad(number.toString(2), 11);
        }

        encoded += bits;
    }

    return encoded;
}

function pad(bits, num, direction = 'left', digits = '0') {
    const difference = num - bits.length;
    if (difference <= 0) {
        return bits;
    }

    let subdigits = '';
    let remainder = difference % digits.length;
    console.log(difference);
    console.log(remainder);
    if (remainder != 0) {
        subdigits = digits.substr(0, remainder);
    }
    const padBits = digits.repeat((num - bits.length) / digits.length) + subdigits;

    return direction == 'left' ? padBits + bits : bits + padBits;
}
