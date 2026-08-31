import CryptoJS from 'crypto-js'
import pako from 'pako'
const CRYPTO_KEY = 'euclid'

/**
 * Encrypt
 * @param msg String to encrypt
 */
export const encrypt = (msg: string) => {
  return CryptoJS.AES.encrypt(msg, CRYPTO_KEY).toString()
}

/**
 * Decrypt
 * @param ciphertext String to decrypt
 */
export const decrypt = (ciphertext: string) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, CRYPTO_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}


export const zip = (str: string) => {
  const arr = pako.deflate(str, { gzip: true } as any);
  const ret = btoa(String.fromCharCode.apply(null, arr as any));
  return ret;
}
 
export const unzip = (b64Data: string) => {
  let strData = atob(b64Data);
  const charData = strData.split("").map(function (x) {
    return x.charCodeAt(0);
  });
  const binData = new Uint8Array(charData);
  const data = pako.inflate(binData);
  strData = new TextDecoder("utf-8").decode(data);
  return JSON.parse(strData);
};