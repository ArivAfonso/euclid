export const downloadSVGFile = (str: string, name: string) => {
  const blob = new Blob([str], { type: "image/svg+xml" })
  const href = URL.createObjectURL(blob)
  const alink = document.createElement("a")
  alink.style.display = "none"
  alink.download = name // Filename after download
  alink.href = href
  document.body.appendChild(alink)
  alink.click()
  document.body.removeChild(alink) // Remove element after download
  URL.revokeObjectURL(href) // Release blob object
}

export const downloadLinkFile = (link: string, name: string) => {
  // const blob = new Blob([str], { type: "image/svg+xml" })
  // const href = URL.createObjectURL(blob)
  const alink = document.createElement("a")
  alink.style.display = "none"
  alink.download = name // Filename after download
  alink.href = link
  document.body.appendChild(alink)
  alink.click()
  document.body.removeChild(alink) // Remove element after download
  URL.revokeObjectURL(link) // Release blob object
}