import React, { useState } from 'react';

const Dialog = ({ isOpen, onClose, title, description, setTitle, setDescription, onAddTask, setSuccessMessage, db }) => {
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;
  const handleSubmit = async (event, newTask) => {
    event.preventDefault();
    
    if (!newTask.title.trim()) return;
  
    try {
      // Check if task exists in IndexedDB
      if (db) {
        const tx = db.transaction('tasks', 'readonly');
        const store = tx.objectStore('tasks');
        const index = store.index('title');
        const existingTask = await index.get(newTask.title.trim());
  
        if (existingTask) {
          setErrorMessage('Task with this title already exists!');
          return;
        }
      }
  
      await onAddTask(newTask);
      setSuccessMessage('Task added successfully!');
      onClose();
      setTitle('');
      setDescription('');
      setErrorMessage('');
    } catch (error) {
      console.error('Error adding task:', error);
      setErrorMessage(`Failed to add task: ${error.message}`);
    }
  };
return (
    <div className="dialog-overlay">
      <div className="dialog">
        <h2>Add New Task</h2>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        <form onSubmit={(e) => handleSubmit(e, {
  id: Date.now(),
  title: title.trim(),
  description,
  completed: false,
  createdAt: new Date().toISOString(),
  modifiedAt: new Date().toISOString()
})}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            required
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Task description"
          />
          <div className="dialog-buttons">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Add Task</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Dialog;
