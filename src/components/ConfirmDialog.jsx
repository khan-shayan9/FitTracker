/**
 * ConfirmDialog Component
 * Reusable confirmation modal for destructive actions (delete, etc.)
 *
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {string} title - Modal title
 * @param {string} message - Descriptive message
 * @param {function} onConfirm - Called when user confirms
 * @param {function} onCancel - Called when user cancels
 * @param {string} confirmText - Text for confirm button (default: 'Delete')
 * @param {string} confirmStyle - Button style class (default: 'btn-danger')
 */
export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Delete',
  confirmStyle = 'btn-danger'
}) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel} id="confirm-cancel-btn">
            Cancel
          </button>
          <button
            className={`btn ${confirmStyle}`}
            onClick={onConfirm}
            id="confirm-action-btn"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
