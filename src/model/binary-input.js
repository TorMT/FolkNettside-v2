/** Normalises browser/Node binary inputs for the model parsers.
 *
 * Parsers historically required a same-realm `ArrayBuffer`. A typed array, a
 * Node `Buffer`, or an ArrayBuffer from another realm (iframe / worker) then
 * failed with a misleading message such as "exceeds safe size limit". This
 * accepts every ordinary byte container and returns a standalone ArrayBuffer
 * without copying when the input already is one.
 */
const tag=value=>Object.prototype.toString.call(value);

export function isArrayBufferLike(value){
  return tag(value)==="[object ArrayBuffer]";
}

export function toArrayBuffer(input,label="Model data"){
  if(isArrayBufferLike(input))return input;
  if(ArrayBuffer.isView(input)){
    const {buffer,byteOffset,byteLength}=input;
    if(tag(buffer)==="[object SharedArrayBuffer]"||byteOffset!==0||byteLength!==buffer.byteLength)
      return new Uint8Array(buffer,byteOffset,byteLength).slice().buffer;
    return buffer;
  }
  throw new TypeError(label+" must be an ArrayBuffer or a typed array of bytes");
}
