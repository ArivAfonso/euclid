import { padStart } from 'lodash-es'
/**
 * 1. Random color
 * 2. Convert image to Base64
 */

export function randomColor() {
  return `#${Math.floor(Math.random() * 0xFFFFFF).toString(16).padEnd(6, '0')}`
}

/**
 * Pad number digits
 * @param digit Number
 * @param len Digit count
 */
export const fillDigit = (digit: number, len: number) => {
  return padStart('' + digit, len, '0')
}

/**
 * Check device type
 */
export const isPC = () => {
  return !navigator.userAgent.match(/(iPhone|iPod|iPad|Android|Mobile|BlackBerry|Symbian|Windows Phone)/i)
}