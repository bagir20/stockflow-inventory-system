import './EmptyState.css'

export default function EmptyState({ image, title, subtitle }) {
  return (
    <div className="empty-state">
      <img src={image} alt={title} className="empty-state-img" />
      <p className="empty-state-title">{title}</p>
      {subtitle && <p className="empty-state-sub">{subtitle}</p>}
    </div>
  )
}