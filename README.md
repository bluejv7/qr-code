# qr-code
Returns a qr code mapping from a given phrase and error correction value.  Currently only supports alphanumeric mode and versions 1-4 with error code grouping/blocks of 1.

# Installation
npm install https://github.com/bluejv7/qr-code

# Usage
```
generateQrCode(phrase: string, errorCorrection?: 'L'|'M'|'Q'|'H'): Array<Array<1|0>>
```
`generateQrCode` takes a string `phrase` and an optional `errorCorrection` (defaults to 'L') to creating a 2d array of `1`s and `0`s to represent the pixels/modules to fill in
for the qr code

# Examples

Making a "HELLO WORLD" code:
```
const generateQrCode = require('qr-code');
console.log(generateQrCode('HELLO WORLD'));
```
```
1,1,1,1,1,1,1,0,1,0,0,0,1,0,1,1,1,1,1,1,1
1,0,0,0,0,0,1,0,1,1,0,1,0,0,1,0,0,0,0,0,1
1,0,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,0,1
1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1
1,0,1,1,1,0,1,0,0,1,1,1,1,0,1,0,1,1,1,0,1
1,0,0,0,0,0,1,0,1,0,1,0,1,0,1,0,0,0,0,0,1
1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
1,1,0,0,1,1,1,0,0,0,0,0,1,0,0,1,0,1,1,1,1
0,1,0,1,1,0,0,0,0,1,1,0,1,0,1,1,1,1,1,0,0
0,1,0,1,1,1,1,1,1,0,1,0,1,0,0,1,1,0,1,0,1
1,1,0,1,0,0,0,0,0,1,1,1,1,0,0,1,1,1,1,0,0
0,1,0,1,0,1,1,0,0,1,0,1,0,1,1,1,0,0,1,1,1
0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,1,0,1,0,0,0
1,1,1,1,1,1,1,0,0,1,0,1,0,0,1,0,0,0,0,0,1
1,0,0,0,0,0,1,0,1,0,0,0,0,1,1,1,1,1,0,1,0
1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,1,0,1,1,0,1
1,0,1,1,1,0,1,0,0,1,1,0,1,1,1,0,0,1,1,1,1
1,0,1,1,1,0,1,0,0,1,1,0,1,1,0,0,0,0,1,0,0
1,0,0,0,0,0,1,0,1,0,1,1,1,0,0,0,1,1,0,0,1
1,1,1,1,1,1,1,0,1,0,0,1,0,0,1,1,1,0,0,1,1
```

Setting a specific error correction:
```
generateQrCode('HELLO WORLD', 'Q');
```
```
1,1,1,1,1,1,1,0,0,0,0,1,0,0,1,1,1,1,1,1,1
1,0,0,0,0,0,1,0,1,1,0,0,1,0,1,0,0,0,0,0,1
1,0,1,1,1,0,1,0,0,1,0,1,1,0,1,0,1,1,1,0,1
1,0,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,0,1
1,0,1,1,1,0,1,0,1,1,0,1,0,0,1,0,1,1,1,0,1
1,0,0,0,0,0,1,0,0,1,0,0,1,0,1,0,0,0,0,0,1
1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1
0,0,0,0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0,0,0
0,1,0,1,1,1,1,0,1,1,0,0,1,1,1,0,1,1,0,1,0
1,0,1,1,1,1,0,1,0,0,0,0,1,1,1,1,0,1,1,1,0
0,0,1,0,1,0,1,1,0,0,0,1,0,0,1,1,0,0,0,0,0
1,0,1,1,0,1,0,0,0,1,0,1,1,0,0,0,1,1,0,0,0
1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,0,1,1,1,1,1
0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,1,0,1,0,0,0
1,1,1,1,1,1,1,0,0,1,1,0,0,1,1,0,0,1,1,1,1
1,0,0,0,0,0,1,0,1,0,1,0,0,1,0,0,1,0,1,1,1
1,0,1,1,1,0,1,0,1,1,0,1,0,0,1,0,0,0,1,1,1
1,0,1,1,1,0,1,0,1,0,1,1,1,0,0,0,1,0,1,0,0
1,0,1,1,1,0,1,0,0,1,0,0,0,0,1,0,0,0,0,1,1
1,0,0,0,0,0,1,0,1,1,1,0,0,1,1,1,0,0,1,1,0
1,1,1,1,1,1,1,0,0,1,0,1,0,0,0,0,0,0,0,1,0
```