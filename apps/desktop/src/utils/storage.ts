/**
 * window.localStorage browser persistent cache
 */
export const localStorage = {
  // Set persistent cache
  set(key: string, val: any) {
    window.localStorage.setItem(key, JSON.stringify(val));
  },
  // Get persistent cache
  get(key: string) {
    const json: any = window.localStorage.getItem(key);
    return JSON.parse(json);
  },
  // Remove persistent cache
  remove(key: string) {
    window.localStorage.removeItem(key);
  },
  // Clear all persistent cache
  clear() {
    window.localStorage.clear();
  },
};

/**
 * window.sessionStorage browser temporary cache
 */
export const sessionStorage = {
  // Set temporary cache
  set(key: string, val: any) {
    window.sessionStorage.setItem(key, JSON.stringify(val));
  },
  // Get temporary cache
  get(key: string) {
    const json: any = window.sessionStorage.getItem(key);
    return JSON.parse(json);
  },
  // Remove temporary cache
  remove(key: string) {
    window.sessionStorage.removeItem(key);
  },
  // Clear all temporary cache
  clear() {
    window.sessionStorage.clear();
  },
};
