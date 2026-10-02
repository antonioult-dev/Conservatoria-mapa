import fs from 'node:fs';
import zlib from 'node:zlib';

function createPNG(width, height, r, g, b) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 2; // Color type: 2 (Truecolor / RGB)
  ihdrData[10] = 0; // Compression: deflate
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace: none
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0 (None)
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowSize);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.44;
  const pinRadius = width * 0.22;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter byte 0

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Pin shape calculation
      const inPinHead = Math.sqrt(dx * dx + (y - cy * 0.75) * (y - cy * 0.75)) < pinRadius;
      const inPinBody = y >= cy * 0.75 && y <= cy * 1.4 && Math.abs(dx) < (pinRadius * (1 - (y - cy * 0.75) / (cy * 0.7)));

      if (inPinHead || inPinBody) {
        // Inner lyre/emblem (gold)
        const inLyre = Math.sqrt(dx * dx + (y - cy * 0.75) * (y - cy * 0.75)) < (pinRadius * 0.4);
        if (inLyre) {
          rawData[pxOffset] = 201;     // Gold R
          rawData[pxOffset + 1] = 151; // Gold G
          rawData[pxOffset + 2] = 50;  // Gold B
        } else {
          rawData[pxOffset] = 255; // White pin R
          rawData[pxOffset + 1] = 255;
          rawData[pxOffset + 2] = 255;
        }
      } else {
        // Dark green #0d3822 background with circular dashed orbit hint
        const isOrbit = Math.abs(dist - width * 0.35) < (width * 0.012);
        if (isOrbit) {
          rawData[pxOffset] = 180;     // Gold orbit
          rawData[pxOffset + 1] = 140;
          rawData[pxOffset + 2] = 54;
        } else {
          rawData[pxOffset] = r;     // #0d
          rawData[pxOffset + 1] = g; // #38
          rawData[pxOffset + 2] = b; // #22
        }
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  // CRC32 calculation
  const crc = calculateCRC32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// Standard PNG CRC-32 table
let crcTable;
function makeCRCTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

function calculateCRC32(buf) {
  if (!crcTable) crcTable = makeCRCTable();
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Generate 192x192 and 512x512
const png192 = createPNG(192, 192, 13, 56, 34); // #0d3822
fs.writeFileSync('./public/icon-192.png', png192);

const png512 = createPNG(512, 512, 13, 56, 34); // #0d3822
fs.writeFileSync('./public/icon-512.png', png512);

console.log('Icons generated successfully: icon-192.png and icon-512.png');
