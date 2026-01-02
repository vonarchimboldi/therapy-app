import React, { useState, useRef } from 'react'
import './RichMessageComposer.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const RichMessageComposer = ({ onSend, disabled, placeholder = 'Type a message...' }) => {
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState([])
  const [linkInput, setLinkInput] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return

    setUploading(true)
    const newAttachments = []

    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          newAttachments.push(data)
        } else {
          alert(`Failed to upload ${file.name}`)
        }
      }

      setAttachments([...attachments, ...newAttachments])
    } catch (err) {
      console.error('Error uploading files:', err)
      alert('Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  const handleAddLink = async () => {
    if (!linkInput.trim()) return

    // Basic URL validation
    let url = linkInput.trim()
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }

    try {
      new URL(url) // Validate URL format
    } catch {
      alert('Please enter a valid URL')
      return
    }

    // Show loading state while fetching
    const loadingAttachment = {
      type: 'link',
      url: url,
      title: 'Loading preview...',
      description: null,
      thumbnail: null,
      loading: true
    }
    setAttachments([...attachments, loadingAttachment])
    setLinkInput('')
    setShowLinkInput(false)

    // Fetch rich link preview from backend
    try {
      const response = await fetch(`${API_URL}/api/fetch-link-preview?url=${encodeURIComponent(url)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const linkData = await response.json()
        // Replace loading attachment with actual data
        setAttachments(prev =>
          prev.map(att =>
            att.url === url && att.loading
              ? { ...linkData, loading: false }
              : att
          )
        )
      } else {
        // If preview fetch fails, use basic link
        setAttachments(prev =>
          prev.map(att =>
            att.url === url && att.loading
              ? { type: 'link', url, title: url, description: null, thumbnail: null, loading: false }
              : att
          )
        )
      }
    } catch (err) {
      console.error('Error fetching link preview:', err)
      // If preview fetch fails, use basic link
      setAttachments(prev =>
        prev.map(att =>
          att.url === url && att.loading
            ? { type: 'link', url, title: url, description: null, thumbnail: null, loading: false }
            : att
        )
      )
    }
  }

  const handleRemoveAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const handleSend = () => {
    if (!content.trim() && attachments.length === 0) return
    onSend(content, attachments)
    setContent('')
    setAttachments([])
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const renderAttachmentPreview = (attachment, index) => {
    switch (attachment.type) {
      case 'image':
        return (
          <div key={index} className="attachment-preview image-preview">
            <img src={`${API_URL}${attachment.url}`} alt={attachment.filename} />
            <button
              className="remove-attachment"
              onClick={() => handleRemoveAttachment(index)}
              type="button"
            >
              ×
            </button>
          </div>
        )

      case 'link':
        return (
          <div key={index} className={`attachment-preview link-preview ${attachment.thumbnail ? 'with-thumbnail' : ''}`}>
            {attachment.thumbnail && (
              <img src={attachment.thumbnail} alt={attachment.title} className="link-preview-thumbnail" />
            )}
            <div className="link-preview-content">
              {!attachment.thumbnail && <span className="link-icon">🔗</span>}
              <div className="link-preview-text">
                <span className="link-title">{attachment.loading ? 'Loading...' : (attachment.title || attachment.url)}</span>
                {attachment.description && (
                  <span className="link-description">{attachment.description}</span>
                )}
                <span className="link-url">{new URL(attachment.url).hostname}</span>
              </div>
            </div>
            <button
              className="remove-attachment"
              onClick={() => handleRemoveAttachment(index)}
              type="button"
            >
              ×
            </button>
          </div>
        )

      default:
        return (
          <div key={index} className="attachment-preview file-preview">
            <span className="file-icon">📄</span>
            <span className="file-text">{attachment.filename}</span>
            <button
              className="remove-attachment"
              onClick={() => handleRemoveAttachment(index)}
              type="button"
            >
              ×
            </button>
          </div>
        )
    }
  }

  return (
    <div className="rich-message-composer">
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="attachments-preview">
          {attachments.map((attachment, index) => renderAttachmentPreview(attachment, index))}
        </div>
      )}

      {/* Link input */}
      {showLinkInput && (
        <div className="link-input-container">
          <input
            type="text"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddLink()}
            placeholder="Paste a link (URL)"
            className="link-input"
            autoFocus
          />
          <button
            className="btn-add-link"
            onClick={handleAddLink}
            disabled={!linkInput.trim()}
            type="button"
          >
            Add
          </button>
          <button
            className="btn-cancel-link"
            onClick={() => {
              setShowLinkInput(false)
              setLinkInput('')
            }}
            type="button"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Main composer */}
      <div className="composer-main">
        <div className="composer-toolbar">
          <button
            className="toolbar-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            title="Attach image or file"
            type="button"
          >
            {uploading ? '⏳' : '📎'}
          </button>
          <button
            className="toolbar-btn"
            onClick={() => setShowLinkInput(!showLinkInput)}
            disabled={disabled}
            title="Add link"
            type="button"
          >
            🔗
          </button>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          className="composer-textarea"
          rows={3}
        />

        <button
          className="btn-send"
          onClick={handleSend}
          disabled={disabled || (!content.trim() && attachments.length === 0)}
          type="button"
        >
          Send
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={(e) => handleFileUpload(Array.from(e.target.files))}
        style={{ display: 'none' }}
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt"
      />
    </div>
  )
}

export default RichMessageComposer
