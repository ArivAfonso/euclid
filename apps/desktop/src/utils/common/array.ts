// 1. Random number within range getRandom(70, 80)
export const getRandom = (n: number, m: number) => Math.floor(Math.random() * (m - n + 1) + n)

// Generate array of length 100
export function createArr(defaultParams = 'Tom') {
  const allItems = Array.from(Array(100).keys(), (item) => {
    return { defaultParams, idx: item }
  })
  // const fillArr = new Array(10).fill({ defaultParams })
  return allItems
}

// Get deepest nesting level of array
export const getLevel = (list: any) => {
  let max = 0
  const stack = [list]
  while (stack.length > 0) {
    const data = stack.pop()
    for (let i = 0; i < data.length; i++) {
      const item = data[i]
      if (Array.isArray(item)) {
        (item as any).level = (data.level || 1) + 1
        max = Math.max((item as any).level, max)
        stack.push(item)
      }
    }
  }
  return max
}

// // Flatten tree array
// export const treeToArr = (arr: any) => {
//   const result = []
//   let node: any[] = []
//   node = node.concat(arr)
//   while (node.length) {
//     const first = node.shift() // Each time take the first item of node
//     if (first.children) {
//       node = node.concat(first.children) // If first item has children property, append children to end of node
//       delete first.children // Then delete children property, making first item a plain form {name: xxx, id: xxx}
//     }
//     // result.push(first)
//   }
//   return result
// }
