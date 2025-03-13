import React, { useContext, useState, useCallback, useEffect } from 'react';
import { FaCheck, FaRedo, FaTrash, FaPencilAlt, FaClock } from 'react-icons/fa';
import { TaskContext } from './TaskContext';

const TaskItem = ({ task }) => {
  const { toggleTask, deleteTask, editTask } = useContext(TaskContext);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [editError, setEditError] = useState('');
  const [timeElapsed, setTimeElapsed] = useState('');

  // Format dates
  const formatDate = useCallback((timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Calculate time elapsed since task creation in real time
  useEffect(() => {
    if (!task.createdAt) return;
    
    const updateTimeElapsed = () => {
      const created = new Date(task.createdAt).getTime();
      const now = new Date().getTime();
      const diffInMs = now - created;
      
      // Convert to appropriate time units
      const minutes = Math.floor(diffInMs / (1000 * 60));
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      if (days > 0) {
        setTimeElapsed(`${days}d ${hours % 24}h ago`);
      } else if (hours > 0) {
        setTimeElapsed(`${hours}h ${minutes % 60}m ago`);
      } else {
        setTimeElapsed(`${minutes}m ago`);
      }
    };
    
    // Update immediately
    updateTimeElapsed();
    
    // Then update every minute
    const interval = setInterval(updateTimeElapsed, 60000);
    
    return () => clearInterval(interval);
  }, [task.createdAt]);

  // Calculate time taken to complete
  const calculateTimeTaken = useCallback((createdAt, completedAt) => {
    if (!createdAt || !completedAt) return '';
    
    const createdTime = new Date(createdAt).getTime();
    const completedTime = new Date(completedAt).getTime();
    const diffInMs = completedTime - createdTime;
    
    // Convert to appropriate time units
    const minutes = Math.floor(diffInMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m`;
    }
  }, []);

  const handleToggle = useCallback(async () => {
    try {
      await toggleTask(task.id);
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  }, [toggleTask, task.id]);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await deleteTask(task.id);
    } catch (error) {
      console.error('Error deleting task:', error);
      setIsDeleting(false);
    }
  }, [deleteTask, task.id]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditError('');
  }, [task.title, task.description]);

  const handleSaveEdit = useCallback(async () => {
    if (!editTitle.trim()) {
      setEditError('Title cannot be empty');
      return;
    }
    
    try {
      await editTask(task.id, editTitle.trim(), editDescription.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving task edit:', error);
      setEditError('Failed to save changes');
    }
  }, [editTask, task.id, editTitle, editDescription]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditError('');
  }, []);

  return (
    <div className={`task-item ${task.completed ? 'completed' : ''} ${isDeleting ? 'deleting' : ''}`}>
      {isEditing ? (
        <div className="task-edit-form">
          <div className="form-group">
            <label htmlFor={`edit-title-${task.id}`}>Title</label>
            <input
              id={`edit-title-${task.id}`}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="edit-title-input"
              autoFocus
            />
            {editError && <div className="edit-error">{editError}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor={`edit-desc-${task.id}`}>Description</label>
            <textarea
              id={`edit-desc-${task.id}`}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="edit-description-input"
            />
          </div>
          
          <div className="edit-actions">
            <button onClick={handleSaveEdit} className="save-btn">Save</button>
            <button onClick={handleCancelEdit} className="cancel-btn">Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div className="task-content">
            <div className="task-header">
              <h3 className={`task-title ${task.completed ? 'completed-title' : ''}`}>
                {task.title}
              </h3>
              <div className="task-time">
                <FaClock className="time-icon" />
                <span className="time-text">{timeElapsed}</span>
              </div>
            </div>
            
            {task.description && (
              <p className="task-description">{task.description}</p>
            )}
            
            <div className="task-meta">
              <div className="meta-item">
                <span className="meta-label">Created:</span>
                <span className="meta-value">{formatDate(task.createdAt)}</span>
              </div>
              
              {task.modifiedAt && task.modifiedAt !== task.createdAt && (
                <div className="meta-item">
                  <span className="meta-label">Modified:</span>
                  <span className="meta-value">{formatDate(task.modifiedAt)}</span>
                </div>
              )}
              
          
              {task.completed && (
                <>
                  <div className="meta-item">
                    <span className="meta-label">Completed:</span>
                    <span className="meta-value">{formatDate(task.completedAt)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Time taken:</span>
                    <span className="meta-value">
                      {calculateTimeTaken(task.createdAt, task.completedAt)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="task-actions">
            <button
              className={`action-btn toggle-btn ${task.completed ? 'completed-btn' : ''}`}
              onClick={handleToggle}
              title={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
            >
              {task.completed ? <FaRedo /> : <FaCheck />}
            </button>
            
            <button 
              className="action-btn edit-btn"
              onClick={handleEdit}
              title="Edit task"
            >
              <FaPencilAlt />
            </button>
            
            <button 
              className="action-btn delete-btn"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete task"
            >
              <FaTrash />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default React.memo(TaskItem);