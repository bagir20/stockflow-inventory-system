import { useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Download, Printer } from 'lucide-react'
import './QRModal.css'

export default function QRModal({ product, onClose }) {
  const qrRef = useRef()

  const handleDownload = () => {
    const svg = qrRef.current.querySelector('svg')
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    canvas.width = 300; canvas.height = 340
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 300, 340)
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 25, 20, 250, 250)
      ctx.fillStyle = '#1a1714'
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(product.name.slice(0, 30), 150, 295)
      ctx.font = '12px monospace'
      ctx.fillStyle = '#7a7168'
      ctx.fillText(product.sku, 150, 318)
      const link = document.createElement('a')
      link.download = `QR-${product.sku}.png`
      link.href = canvas.toDataURL()
      link.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  const handlePrint = () => {
    const svg = qrRef.current.querySelector('svg')
    const svgData = new XMLSerializer().serializeToString(svg)
    const win = window.open('', '_blank')
   win.document.write(`
  <html><head><title>QR - ${product.sku}</title>
  <style>
    body { font-family: sans-serif; text-align: center; padding: 40px; }
    h3   { margin: 16px 0 4px; font-size: 16px; }
    p    { color: #666; font-size: 13px; font-family: monospace; }
  </style></head>
  <body>
    ${svgData}
    <h3>${product.name}</h3>
    <p>${product.sku}${product.barcode ? ` · ${product.barcode}` : ''}</p>
    <script>window.onload=()=>{window.print();window.close()}</` + `script>
  </body></html>
`)
    win.document.close()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="qr-modal">
        <div className="qr-modal-header">
          <p className="qr-modal-title">QR Code</p>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="qr-modal-body">
          <div className="qr-wrapper" ref={qrRef}>
            <QRCodeSVG
              value={product.barcode || product.sku}
              size={200}
              style={{display:'block'}}
            />
          </div>
          <div className="qr-info">
            <p className="qr-product-name">{product.name}</p>
            <p className="qr-sku">SKU: {product.sku}</p>
            {product.barcode && <p className="qr-barcode">Barcode: {product.barcode}</p>}
          </div>
          <div className="qr-actions">
            <button className="qr-btn download" onClick={handleDownload}>
              <Download size={15} /> Download PNG
            </button>
            <button className="qr-btn print" onClick={handlePrint}>
              <Printer size={15} /> Print
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}