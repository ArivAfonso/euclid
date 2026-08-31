/*
 * @Author: June 1601745371@qq.com
 * @Date: 2024-03-08 10:48:02
 * @LastEditors: June 1601745371@qq.com
 * @LastEditTime: 2024-03-08 10:48:19
 * @FilePath: \github\euclid\src\utils\local.ts
 * @Description: This is default setting. Please set `customMade`, open koroFileHeader to view config: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/**
 * get localStorage - get local storage
 * @param { String } key
 */
export function getLocal(key: string) {
    if (!key) throw new Error('key is empty');
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
}
  
/**
 * set localStorage - set local storage
 * @param { String } key
 * @param value
 */
export function setLocal(key: string, value: unknown) {
    if (!key) throw new Error('key is empty');
    if (!value) return;
    return localStorage.setItem(key, JSON.stringify(value));
}

/**
 * remove localStorage - remove a local storage item
 * @param { String } key
 */
export function removeLocal(key: string) {
    if (!key) throw new Error('key is empty');
    return localStorage.removeItem(key);
}

/**
 * clear localStorage - clear local storage
 */
export function clearLocal() {
    return localStorage.clear();
}
  