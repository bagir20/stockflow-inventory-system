import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { X, Camera } from 'lucide-react'
import './QRScanner.css'

export default function QRScanner({ onResult, onClose }) {
  const videoRef  = useRef()
  const readerRef = useRef()
  const streamRef = useRef(null) 
  const [error, setError] = useState('')

  const stopCamera = () => {
  try {
  readerRef.current?.reset()
} catch (err) {
  console.warn('Failed to reset camera', err)
}

    // ⬅️ STOP dari streamRef (lebih reliable)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    // fallback (optional)
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
  }

 useEffect(() => {
  const reader = new BrowserMultiFormatReader()
  readerRef.current = reader

  navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      streamRef.current = stream // ⬅️ simpan stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      reader.decodeFromVideoElement(videoRef.current, (result) => {
        if (result) {
          stopCamera()
          onResult(result.getText())
        }
      })
    })
    .catch(() => {
      setError('Kamera tidak dapat diakses.')
    })

  return () => stopCamera()
}, [])

  const handleClose = () => {
    stopCamera()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && handleClose()}>
      <div className="scanner-modal">
        <div className="scanner-header">
          <div className="scanner-header-left">
            <Camera size={18} />
            <p className="scanner-title">Scan QR / Barcode</p>
          </div>
          <button className="modal-close" onClick={handleClose}><X size={16} /></button>
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