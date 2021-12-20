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

const LOG_TABLE = getLogTable();
const ANTILOG_TABLE = LOG_TABLE.reduce((acc, n, i) => {
    acc[n] = i;
    return acc;
}, {});

const errorCorrection = 'M';
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

// TODO: Break data codewords into groups/blocks, if necessary

// Generate Error codes
const encodedData = modeIndicator + characterCountIndicator + encodedPhrase + terminator + bytePad + lengthPad;
let codewords = [];
for (let i = 0; i < encodedData.length; i += 8) {
    codewords.push(encodedData.substr(i, 8));
}
const errorCodewords = getErrorCodewords(version, errorCorrection, codewords);

// Make QR module map
let map = Array.apply(null, Array(21 + (version.version - 1))).map(() => {
    return Array.apply(null, Array(21 + version.version - 1)).map(() => '-');
});

const endIndex = (version.version - 1) * 4 + 21 - 7;

addFinder(map, 0, 0);
addFinder(map, endIndex, 0);
addFinder(map, 0, endIndex);

// Add separators
for (let i = 0; i < 7; i++) {
    map[i][7] = 's';
    map[i][endIndex - 1] = 's';
    map[endIndex+6-i][7] = 's';
}
for (let i = 0; i < 8; i++) {
    map[7][i] = 's';
    map[7][endIndex - 1 + i] = 's';
    map[endIndex-1][i] = 's';
}

// TODO: Add alignment patterns

// Add timing patterns
for (let i = 8; i < endIndex - 1; i++) {
    const val = ((i + 1) % 2) ? 'T' : 't';
    map[6][i] = val;
    map[i][6] = val;
}

// Add Dark module
map[4 * version.version + 9][8] = 'D';

// Reserve Format Info Area
for (let i = 0; i < 8; i++) {
    if (map[i][8] == '-') {
        map[i][8] = 'R';
    }

    if (map[8][i] == '-') {
        map[8][i] = 'R';
    }

    if (map[8][endIndex-1+i] == '-') {
        map[8][endIndex-1+i] = 'R';
    }

    if (map[endIndex-1+i][8] == '-') {
        map[endIndex-1+i][8] = 'R';
    }
}
map[8][8] = 'R';

// Reserve Version Info Area (if version 7+)
if (version.version >= 7) {
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 3; j++) {
            map[i][endIndex-2-j] = 'R';
            map[endIndex-2-j][i] = 'R';
        }
    }
}

addData(map, codewords.concat(errorCodewords).join('').split(''));

// Note: Not sure about mask code
addMask(map);

console.log(map.join('\n'));

function addData(map, bits) {
    let isUp = true;
    let x = map.length - 1;
    let y = map.length - 1;

    let count = 0;
    while (bits.length) {
        if (isUp) {
            setMapBit(map, x, y, bits);
            x--;
            setMapBit(map, x, y, bits);
            x++;
            y--;
        } else {
            setMapBit(map, x, y, bits);
            x--;
            setMapBit(map, x, y, bits);
            x++;
            y++;
        }

        if (y >= map.length || y < 0) {
            x -= 2;
            y = isUp ? 0 : map.length - 1;
            isUp = !isUp;
        }

        // If vertical timing, skip column
        if (x == 6 && (map[y][x] == 't' || map[y][x] == 'T')) {
            x--;
        }

        count++;
        if (count > 500) {
            break;
        }
    }
}

function addFinder(map, x, y) {
    // Top/Bottom
    for (let i = 0; i < 7; i++) {
        map[y][x+i] = 'F';
        map[y+6][x+i] = 'F';
    }

    // Top/Bottom border gap
    [y+1, y+5].forEach(i => {
        map[i][x] = 'F';
        for (let j = x + 1; j < x + 7; j++) {
            map[i][j] = 'f';
        }
        map[i][x+6] = 'F';
    });

    // Middle
    for (let i = y + 2; i < y + 5; i++) {
        // Middle border
        map[i][x] = 'F';
        map[i][x+1] = 'f';
        map[i][x+5] = 'f';
        map[i][x+6] = 'F';

        // Middle square
        for (let j = x + 2; j < x + 5; j++) {
            map[i][j] = 'F';
        }
    }
}

function addMask(map) {
    let bestMap = null;
    let penalty = null;
    for (let i = 0; i < 8; i++) {
        // Apply mask
        const currentMap = map.map(row => row.slice());
        const fn = getMaskFn(i);
        for (let row = 0; row < currentMap.length; row++) {
            for (let column = 0; column < currentMap[row].length; column++) {
                if (Number.isInteger(parseInt(currentMap[row][column])) && fn(row, column)) {
                    currentMap[row][column] = currentMap[row][column] == 1 ? 0 : 1;
                }
            }
        }

        // Calculate penalties
        let currentPenalty = 0;

        // Penalty 1 - 5+ same in a row
        for (let row = 0; row < currentMap.length; row++) {
            let currentBit = getModuleBit(currentMap[row][0]);
            let currentCount = 1;
            for (let column = 1; column < currentMap[row].length; column++) {
                if (currentBit == getModuleBit(currentMap[row][column])) {
                    currentCount++;
                } else {
                    currentBit = currentBit ? 0 : 1;
                    currentCount = 1;
                }

                if (currentCount == 5) {
                    currentPenalty += 3;
                } else if (currentCount > 5) {
                    currentPenalty++;
                }
            }
        }

        // Penalty 2 - 2x2 squares, overlapping counts
        for (let row = 0; row < currentMap.length - 1; row++) {
            for (let column = 0; column < currentMap[row].length - 1; column++) {
                let currentBit = getModuleBit(currentMap[row][column]);
                if (currentBit != getModuleBit(currentMap[row+1][column])) {
                    continue;
                }
                if (currentBit != getModuleBit(currentMap[row][column+1])) {
                    continue;
                }
                if (currentBit != getModuleBit(currentMap[row+1][column+1])) {
                    continue;
                }

                currentPenalty += 3;
            }
        }

        // Penalty 3 - "1011101" with "0000" on either side
        for (let row = 0; row < currentMap.length - 10; row++) {
            for (let column = 0; column < currentMap[row].length - 10; column++) {
                const pattern1 = '10111010000';
                const pattern2 = '00001011101';
                let whichPattern = null;
                let hasPattern = true;
                for (let pIndex = 0; pIndex < pattern1.length; pIndex++) {
                    const bit = getModuleBit(currentMap[row][column+pIndex]);
                    if (whichPattern == null) {
                        whichPattern = bit == 1 ? 1 : 2;
                        continue;
                    }
                    if (whichPattern == 1 && bit != pattern1[pIndex]) {
                        hasPattern = false;
                        break;
                    } else if (whichPattern == 2 && bit != pattern2[pIndex]) {
                        hasPattern = false;
                        break;
                    }
                }

                if (hasPattern) {
                    currentPenalty += 40;
                }
            }
        }

        // Penalty 4 - balance
        const dark = currentMap.reduce((acc, row) => {
            acc += row.reduce((_acc, column) => {
                if (getModuleBit(column) == 1) {
                    _acc++;
                }
                return _acc;
            }, 0);
            return acc;
        }, 0);
        const total = Math.pow(currentMap.length, 2);
        const percent = parseInt(dark / total * 100);
        const percentRemainder = percent % 5;
        const previousMultiple = Math.abs((percent - percentRemainder) - 50);
        const nextMultiple = Math.abs((percent + 5 - percentRemainder) - 50);
        currentPenalty += Math.min(previousMultiple, nextMultiple) * 10;

        if (bestMap == null) {
            bestMap = currentMap;
            penalty = currentPenalty;
        } else if (currentPenalty < penalty) {
            bestMap = currentMap;
            penalty = currentPenalty;
        }
    }

    map.splice(0, map.length, ...bestMap);
}

function dividePolynomials(a, b) {
    // TODO: Error checking
    let remainder = a.slice();
    let leadTerm = remainder[0];
    const n = remainder.findIndex(val => val === null);
    if (n == -1) {
        throw('[dividePolynomials]: No null term in polynomial a');
    }

    for (let i = 0; i < n; i++) {
        let dividend = [];
        let result = [];
        for (let j = b.length - 1; j >= 0; j--) {
            let val = b[j];
            let logVal = 0;

            if (val !== null) {
                val += leadTerm;
                if (val > 255) {
                    val = val % 255;
                }

                logVal = LOG_TABLE[val];
            }

            result.push(ANTILOG_TABLE[LOG_TABLE[remainder[b.length - 1 - j]] ^ logVal]);
        }

        result.shift();
        leadTerm = result[0];
        remainder = result;
    }

    return remainder
        .filter(codeword => codeword !== null && codeword !== undefined)
        .map(codeword => pad(LOG_TABLE[codeword].toString(2), 8));
}

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

function getErrorCodewords(version, errorCorrection, codewords) {
    const generatorPolynomial = getGeneratorPolynomial(ERROR_CORRECTION[version.version - 1][errorCorrection].ecCodewords);

    // Make message polynomial
    const messagePolynomial = codewords.map(codeword => {
        return ANTILOG_TABLE[parseInt(codeword, 2)];
    });

    for (let i = 0; i < generatorPolynomial.length; i++) {
        messagePolynomial.push(null);
    }
    while (generatorPolynomial.length < messagePolynomial.length) {
        generatorPolynomial.unshift(null);
    }

    // Perform long division
    return dividePolynomials(messagePolynomial, generatorPolynomial);
}

function getGeneratorPolynomial(n) {
    if (n < 0) {
        throw('[getGeneratorPolynomial]: n must be >= 0');
    }
    if (n == 0) {
        return [];
    }

    let polynomial = [0, 0];
    for (let i = 1; i < n; i++) {
        polynomial = getMultipliedPolynomials(polynomial, [i, 0]);
    }

    return polynomial;
}

function getLogTable() {
    let lastNum = 1;
    let table = [lastNum];
    for (let i = 1; i < 256; i++) {
        let num = lastNum * 2;
        if (num > 255) {
            num ^= 285;
        }

        lastNum = num;
        table.push(num);
    }

    return table;
}

function getMaskFn(num) {
    switch (num) {
        case 0:
            return (row, column) => (row + column) % 2 == 0;
        case 1:
            return (row, column) => row % 2 == 0;
        case 2:
            return (row, column) => column % 3 == 0;
        case 3:
            return (row, column) => (row + column) % 3 == 0;
        case 4:
            return (row, column) => (Math.floor(row / 2) + Math.floor(column / 3)) % 2 == 0;
        case 5:
            return (row, column) => ((row * column) % 2) + ((row * column) % 3) == 0;
        case 6:
            return (row, column) => (((row * column) % 2) + ((row * column) % 3)) % 2 == 0;
        case 7:
            return (row, column) => (((row + column) % 2) + ((row * column) % 3)) % 2 == 0;
        default:
            throw(`[getMaskFn]: Could not get fn for num ${num}`);
    }
}

function getMultipliedPolynomials(a, b) {
    let polynomial = [];
    for (let i = 0; i < a.length + b.length - 1; i++) {
        polynomial.push(null);
    }

    for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < b.length; j++) {
            if (a[i] === null || b[j] === null) {
                continue;
            }

            let sum = a[i] + b[j];
            if (sum >= 256) {
                sum = sum % 255;
            }

            if (polynomial[i+j] === null) {
                polynomial[i+j] = sum;
                continue;
            }

            polynomial[i+j] = ANTILOG_TABLE[LOG_TABLE[polynomial[i+j]] ^ LOG_TABLE[sum]];
        }
    }

    return polynomial;
}

function getModuleBit(module) {
    if (Number.isInteger(module)) {
        return module;
    }
    if (module.match(/^[A-Z1]+$/)) {
        return 1;
    }
    return 0;
}

function pad(bits, num, direction = 'left', digits = '0') {
    const difference = num - bits.length;
    if (difference <= 0) {
        return bits;
    }

    let subdigits = '';
    let remainder = difference % digits.length;
    if (remainder != 0) {
        subdigits = digits.substr(0, remainder);
    }
    const padBits = digits.repeat((num - bits.length) / digits.length) + subdigits;

    return direction == 'left' ? padBits + bits : bits + padBits;
}

function setMapBit(map, x, y, bits) {
    if (map[y][x] == '-') {
        map[y][x] = bits.shift();
    }
}
