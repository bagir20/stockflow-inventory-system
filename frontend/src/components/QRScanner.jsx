import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { X, Camera } from 'lucide-react'
import './QRScanner.css'

export default function QRScanner({ onResult, onClose }) {
  const videoRef  = useRef()
  const readerRef = useRef()
  const [error,    setError]    = useState('')
  const [scanning, setScanning] = useState(true)

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader

    reader.decodeFromVideoDevice(null, videoRef.current, (result) => {
      if (result && scanning) {
        setScanning(false)
        onResult(result.getText())
      }
    }).catch(() => {
      setError('Kamera tidak dapat diakses. Pastikan izin kamera sudah diberikan.')
    })

    return () => {
      try { readerRef.current?.reset() } catch { /* ignore */ }
    }
  }, [onResult, scanning])

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="scanner-modal">
        <div className="scanner-header">
          <div className="scanner-header-left">
            <Camera size={18} />
            <p className="scanner-title">Scan QR / Barcode</p>
          </div>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="scanner-body">
          {error ? (
            <div className="scanner-error">{error}</div>
          ) : (
            <>
              <div className="scanner-viewport">
                <video ref={videoRef} className="scanner-video" />
                <div className="scanner-overlay">
                  <div className="scanner-frame" />
                </div>
              </div>
              <p className="scanner-hint">
                Arahkan kamera ke QR Code atau Barcode produk
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}