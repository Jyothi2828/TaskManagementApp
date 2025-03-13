import React, { useState } from 'react';
import { FaCheck, FaPencilAlt, FaTrash, FaRedo } from 'react-icons/fa';
// import '../styles/TaskList.css';

const TaskList = ({ tasks, onToggleTask, onDeleteTask, onEditTask, onReorderTasks }) => {
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const handleEditClick = (task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description);
  };

  const handleEditSave = (taskId) => {
    onEditTask(taskId, editTitle, editDescription);
    setEditingTaskId(null);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Not available';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatTime = (timeInSeconds) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;
  
    if (hours > 0) {
      return `${hours} hr ${minutes} min ${seconds} sec`;
    } else if (minutes > 0) {
      return `${minutes} min ${seconds} sec`;
    } else {
      return `${seconds} sec`;
    }
  };
  

  const calculateTimeTaken = (createdAt, completedAt) => {
    if (!createdAt || !completedAt) return '';

    const createdTime = new Date(createdAt).getTime();
    const completedTime = new Date(completedAt).getTime();
    const diffInMs = completedTime - createdTime;

    // Convert milliseconds to seconds
    const seconds = Math.floor(diffInMs / 1000);

    return formatTime(seconds); // using formatTime to display it as min and sec
  };

  const handleDragStart = (event, task) => {
    event.dataTransfer.setData('taskId', task.id);
  };

  const handleDrop = (event, targetTask) => {
    const draggedTaskId = event.dataTransfer.getData('taskId');
    const draggedTask = tasks.find((task) => task.id === Number(draggedTaskId));

    if (!draggedTask) return; // Add a check to handle undefined draggedTask

    // Reorder the tasks by swapping positions
    onReorderTasks(draggedTask, targetTask);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  return (
    <ul className="task-list">
      {tasks.map((task, index) => (
        <li
          key={task.id}
          className={`task-item ${task.completed ? 'completed' : ''}`}
          draggable
          onDragStart={(e) => handleDragStart(e, task)}
          onDrop={(e) => handleDrop(e, task)}
          onDragOver={handleDragOver}
        >
          {editingTaskId === task.id ? (
            <div className="task-edit">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="edit-input"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="edit-textarea"
              />
              <button onClick={() => handleEditSave(task.id)} className="save-btn">
                Save
              </button>
            </div>
          ) : (
            <>
              <div className="task-content">
                <h3 className="task-title">{task.title}</h3>
                <p className="task-description">{task.description}</p>

                <div className="task-meta">
                  {!task.completed ? (
                    <>
                      {task.modifiedAt ? (
                        <span>Modified: {formatDate(task.modifiedAt)}</span>
                      ) : (
                        <span>Created: {formatDate(task.createdAt)}</span>
                      )}

                      {task.readdedAt && (
                        <span>Re-added: {formatDate(task.readdedAt)}</span>
                      )}
                    </>
                  ) : (
                    <>
                      <span>Completed at: {formatDate(task.completedAt)}</span>
                      <span>Time taken: {calculateTimeTaken(task.createdAt, task.completedAt)}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="task-actions">
                <button
                  className={`action-btn toggle-btn ${task.completed ? 'completed' : ''}`}
                  onClick={() => onToggleTask(task.id)}
                >
                  {task.completed ? <FaRedo /> : <FaCheck />}
                </button>
                <button className="action-btn edit-btn" onClick={() => handleEditClick(task)}>
                  <FaPencilAlt />
                </button>
                <button className="action-btn delete-btn" onClick={() => onDeleteTask(task.id)}>
                  <FaTrash />
                </button>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
};

export default TaskList;


