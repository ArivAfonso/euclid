export const THEME_TYPE = [
  {
    id: 0,
    theme: '',
  },
]

/**
* Range random integer
* @param min Minimum number
* @param max Maximum number
*/
export function ranInt(min: number, max: number) {
 return Math.floor(Math.random() * (max - min) + min);
}

/**
* Randomly generate Chinese text
* @param min 
* @param max 
*/
export function randomText(min: number, max: number) {
 const len = parseInt((Math.random() * max).toString()) + min;
 const base = 20000;
 const range = 1000;
 let str = '';
 let i = 0;
 while (i < len) {
   i++;
   const lower = parseInt((Math.random() * range).toString());
   str += String.fromCharCode(base + lower);
 }
 return str;
}