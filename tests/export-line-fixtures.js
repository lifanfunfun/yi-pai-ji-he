import {makeLineFixture} from '../src/doodle/liveLineScanner.js';
import {deflateSync} from 'node:zlib';
import {mkdirSync,writeFileSync} from 'node:fs';
const directory=new URL('../assets/line-test/',import.meta.url);mkdirSync(directory,{recursive:true});
function crc32(bytes) {let crc=0xffffffff;for(const b of bytes){crc^=b;for(let i=0;i<8;i++) crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function chunk(type,bytes) {const name=Buffer.from(type);const length=Buffer.alloc(4);length.writeUInt32BE(bytes.length);const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(Buffer.concat([name,bytes])));return Buffer.concat([length,name,bytes,crc]);}
for(const kind of ['sparse','dense','fingerprint','rising','mixed']) {
  const {width,height,data}=makeLineFixture(kind);const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
  const raw=Buffer.alloc((width*4+1)*height);
  for(let y=0;y<height;y++) Buffer.from(data.buffer,y*width*4,width*4).copy(raw,y*(width*4+1)+1);
  writeFileSync(new URL(`${kind}.png`,directory),Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));
}
