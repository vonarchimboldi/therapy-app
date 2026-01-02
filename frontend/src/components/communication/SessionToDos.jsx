import React, { useState, useEffect } from 'react'
import './SessionToDos.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const SessionToDos = ({ sessionId, clientId }) => {
  const [todos, setTodos] = useState([])
  const [newTodoText, setNewTodoText] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (sessionId) {
      fetchTodos()
    }
  }, [sessionId])

  const fetchTodos = async () => {
    try {
      const response = await fetch(`${API_URL}/api/todos/session/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setTodos(data)
      }
    } catch (err) {
      console.error('Error fetching todos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTodo = async (e) => {
    e.preventDefault()
    if (!newTodoText.trim()) return

    setAdding(true)
    try {
      const response = await fetch(`${API_URL}/api/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          text: newTodoText,
          client_id: clientId,
          source_session_id: sessionId
        })
      })

      if (response.ok) {
        const newTodo = await response.json()
        setTodos([...todos, newTodo])
        setNewTodoText('')
      }
    } catch (err) {
      console.error('Error adding todo:', err)
    } finally {
      setAdding(false)
    }
  }

  const handleToggleTodo = async (todoId, currentStatus) => {
    const newStatus = currentStatus === 'open' ? 'completed' : 'open'

    try {
      const response = await fetch(`${API_URL}/api/todos/${todoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: newStatus,
          completed_session_id: newStatus === 'completed' ? sessionId : null
        })
      })

      if (response.ok) {
        const updatedTodo = await response.json()
        setTodos(todos.map(t => t.id === todoId ? updatedTodo : t))
      }
    } catch (err) {
      console.error('Error updating todo:', err)
    }
  }

  const handleDeleteTodo = async (todoId) => {
    if (!confirm('Delete this to-do?')) return

    try {
      const response = await fetch(`${API_URL}/api/todos/${todoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        setTodos(todos.filter(t => t.id !== todoId))
      }
    } catch (err) {
      console.error('Error deleting todo:', err)
    }
  }

  const openTodos = todos.filter(t => t.status === 'open')
  const completedTodos = todos.filter(t => t.status === 'completed')

  if (loading) {
    return <div className="session-todos-loading">Loading to-dos...</div>
  }

  return (
    <div className="session-todos">
      <div className="session-todos-header">
        <h3>Session To-Dos</h3>
        <span className="todo-count">
          {openTodos.length} open
        </span>
      </div>

      {/* Add new todo */}
      <form className="add-todo-form" onSubmit={handleAddTodo}>
        <input
          type="text"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          placeholder="Add a follow-up or reminder..."
          disabled={adding}
        />
        <button type="submit" disabled={adding || !newTodoText.trim()}>
          {adding ? 'Adding...' : '+ Add'}
        </button>
      </form>

      {/* Open todos */}
      {openTodos.length > 0 && (
        <div className="todo-section">
          <h4 className="todo-section-title">Open Items</h4>
          <div className="todo-list">
            {openTodos.map(todo => (
              <div key={todo.id} className="todo-item">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => handleToggleTodo(todo.id, todo.status)}
                  className="todo-checkbox"
                />
                <div className="todo-content">
                  <p className="todo-text">{todo.text}</p>
                  {todo.source_session_id !== sessionId && (
                    <span className="todo-badge">Carried forward</span>
                  )}
                </div>
                <button
                  className="todo-delete"
                  onClick={() => handleDeleteTodo(todo.id)}
                  title="Delete to-do"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed todos */}
      {completedTodos.length > 0 && (
        <div className="todo-section">
          <h4 className="todo-section-title">Completed</h4>
          <div className="todo-list">
            {completedTodos.map(todo => (
              <div key={todo.id} className="todo-item completed">
                <input
                  type="checkbox"
                  checked={true}
                  onChange={() => handleToggleTodo(todo.id, todo.status)}
                  className="todo-checkbox"
                />
                <div className="todo-content">
                  <p className="todo-text">{todo.text}</p>
                </div>
                <button
                  className="todo-delete"
                  onClick={() => handleDeleteTodo(todo.id)}
                  title="Delete to-do"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {todos.length === 0 && (
        <p className="no-todos">No to-dos for this session yet.</p>
      )}
    </div>
  )
}

export default SessionToDos
