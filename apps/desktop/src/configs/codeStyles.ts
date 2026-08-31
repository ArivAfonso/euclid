export const QRCodeStyleLibs = [
  {'name': 'A1', index: 0},
  {'name': 'A2', index: 1},
  {'name': 'A3', index: 2},
  {'name': 'SP1', index: 3},
  {'name': 'SP2', index: 4},
  {'name': 'SP3', index: 5},
  {'name': 'B1', index: 6},
  {'name': 'C1', index: 7},
  // {'name': 'C2', index: 8},
  {'name': 'A_a1', index: 9},
  {'name': 'A_a2', index: 10},
  {'name': 'A_b1', index: 11},
  {'name': 'A_b2', index: 12},
]

export const BarCodeStyleLibs = [
  {'name': 'CODE128', 'value': 'CODE128', index: 0, 'info': 'CODE 128 is a versatile barcode. It supports all 128 ASCII characters but also efficiently encodes numbers. It has three modes (A/B/C) and can switch between them at any time'},
  {'name': 'EAN-13', 'value': 'EAN13', index: 1, 'info': 'EAN has multiple forms, the most commonly used is EAN-13 (GTIN-13), used worldwide to identify product identities'},
  {'name': 'EAN-8', 'value': 'EAN8', index: 2},
  {'name': 'EAN-5', 'value': 'EAN5', index: 3},
  {'name': 'EAN-2', 'value': 'EAN2', index: 4},
  {'name': 'UPC(A)', 'value': 'UPC', index: 5},
  {'name': 'UPC(E)', 'value': 'EAN-13', index: 6},
  {'name': 'ITF', 'value': 'ITF',index: 7},
  {'name': 'ITF-14', 'value': 'ITF14', index: 9},
  {'name': 'MSI', 'value': 'MSI',index: 10},
  {'name': 'Pharmacode', 'value': 'pharmacode', index: 11},
  {'name': 'Codabar', 'value': 'codabar', index: 12},
]

export const CodeStyleImage = new URL(`/src/assets/images/escheresque.png`, import.meta.url).href