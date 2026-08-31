export async function loadFont(fontFamily: string) {
  try {
    const fonts = await window.queryLocalFonts();
    return fonts.find(item => item.family === fontFamily)
  } catch(e: any) {
    console.log(`Cannot query fonts: ${e.message}`)
  }
  return undefined
}