import './PageLoader.css'

export default function PageLoader() {
  return (
    <div className="page-loader">
      <div className="page-loader-inner">
        <div className="loader-logo">
          <span>SF</span>
        </div>
        <div className="loader-bar">
          <div className="loader-bar-fill" />
        </div>
        <p className="loader-text">Loading...</p>
      </div>
    </div>
  )
}