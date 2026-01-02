import React, { useState, useEffect, useRef } from 'react'
import './MessageThread.css'
import RichMessageComposer from './RichMessageComposer'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const MessageThread = ({ clientId, clientName }) => {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (clientId) {
      fetchMessages()
      // Poll for new messages every 10 seconds
      const interval = setInterval(fetchMessages, 10000)
      return () => clearInterval(interval)
    }
  }, [clientId])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/messages/thread/${clientId}?other_party_type=client`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )
      if (response.ok) {
        const data = await response.json()
        setMessages(data)

        // Mark unread messages as read
        data.forEach(msg => {
          if (!msg.read && msg.recipient_type === 'therapist') {
            markAsRead(msg.id)
          }
        })
      }
    } catch (err) {
      console.error('Error fetching messages:', err)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (messageId) => {
    try {
      await fetch(`${API_URL}/api/messages/${messageId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
    } catch (err) {
      console.error('Error marking message as read:', err)
    }
  }

  const handleSendMessage = async (content, attachments) => {
    if (!content.trim() && attachments.length === 0) return

    setSending(true)
    try {
      const response = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          recipient_id: clientId,
          recipient_type: 'client',
          content: content,
          attachments: attachments
        })
      })

      if (response.ok) {
        const newMessage = await response.json()
        setMessages([...messages, newMessage])
      }
    } catch (err) {
      console.error('Error sending message:', err)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } else if (diffInHours < 48) {
      return 'Yesterday at ' + date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    }
  }

  const renderAttachment = (attachment) => {
    switch (attachment.type) {
      case 'image':
        return (
          <div key={attachment.url} className="message-attachment">
            <img src={`${API_URL}${attachment.url}`} alt={attachment.filename} />
          </div>
        )

      case 'link':
        return (
          <a
            key={attachment.url}
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="message-link-preview"
          >
            {attachment.thumbnail && (
              <img src={attachment.thumbnail} alt={attachment.title} className="link-thumbnail" />
            )}
            <div className="link-info">
              <strong>{attachment.title || attachment.url}</strong>
              {attachment.description && <p>{attachment.description}</p>}
              <span className="link-url">{new URL(attachment.url).hostname}</span>
            </div>
          </a>
        )

      case 'file':
      case 'pdf':
      default:
        return (
          <a
            key={attachment.url}
            href={`${API_URL}${attachment.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="message-file"
          >
            <span className="file-icon">📄</span>
            <span className="file-name">{attachment.filename}</span>
            {attachment.size && (
              <span className="file-size">
                {(attachment.size / 1024).toFixed(1)} KB
              </span>
            )}
          </a>
        )
    }
  }

  if (loading) {
    return <div className="message-thread-loading">Loading messages...</div>
  }

  return (
    <div className="message-thread">
      <div className="message-thread-header">
        <h3>Messages with {clientName}</h3>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.sender_type === 'therapist' ? 'sent' : 'received'}`}
              >
                <div className="message-bubble">
                  <div className="message-sender">
                    {message.sender_type === 'therapist' ? 'You' : clientName}
                  </div>

                  {message.content && (
                    <div className="message-content">
                      {message.content}
                    </div>
                  )}

                  {message.attachments && message.attachments.length > 0 && (
                    <div className="message-attachments">
                      {message.attachments.map(attachment => renderAttachment(attachment))}
                    </div>
                  )}

                  <div className="message-time">
                    {formatMessageTime(message.created_at)}
                    {message.sender_type === 'therapist' && (
                      <span className="message-status">
                        {message.read ? ' · Read' : ' · Sent'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <RichMessageComposer
        onSend={handleSendMessage}
        disabled={sending}
        placeholder="Type a message..."
      />
    </div>
  )
}

export default MessageThread
