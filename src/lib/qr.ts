import QRCode from 'qrcode'

export async function generateQRCodeDataURL(token: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(token, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
    return dataUrl
  } catch (error) {
    throw new Error('Failed to generate QR Code')
  }
}

export async function generateQRCodeBuffer(token: string): Promise<Buffer> {
  try {
    const buffer = await QRCode.toBuffer(token, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
    return buffer
  } catch (error) {
    throw new Error('Failed to generate QR Code buffer')
  }
}
