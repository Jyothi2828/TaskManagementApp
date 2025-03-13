import React, { useState } from 'react';
import { FaSearch, FaPlus, FaMoon, FaSun } from 'react-icons/fa';
import Dialog from './Dialog';
// import ''; // Adjust the path as necessary

const NavBar = ({ darkMode, toggleDarkMode, onSearch, onAddTask, windowWidth, db }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      // Check if task exists in IndexedDB
      if (db) {
        const tx = db.transaction('tasks', 'readonly');
        const store = tx.objectStore('tasks');
        const index = store.index('title');
        const range = IDBKeyRange.only(title.trim());
        const count = await index.count(range);
        
        if (count > 0) {
          setErrorMessage('Task with this title already exists!');
          setSuccessMessage('');
          return;
        }
      }

      // If no duplicate, proceed to add
      const newTask = {
        id: Date.now(),
        title: title.trim(),
        description,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      
      await onAddTask(newTask);
      
      setTitle('');
      setDescription('');
      setIsDialogOpen(false);
      setErrorMessage('');
      setSuccessMessage('Task added successfully!');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (error) {
      console.error('Database error:', error);
      setErrorMessage('Error checking for existing tasks');
    }
  };

  return (
    <>
      <nav className={`navbar ${darkMode ? 'dark' : ''}`}>
        <div className="nav-content">
          <h1 className="app-title">
            {windowWidth > 768 ? 'Task Manager' : 'Tasks'}
          </h1>
          <div className="search-container">
            <span className="search-icon" onClick={() => setIsDialogOpen(true)}>
              <FaPlus className="add-icon" />
            </span>
            <input
              type="text"
              placeholder="Search tasks..."
              onChange={(e) => onSearch(e.target.value)}
              className="search-input"
            />
            <button className="search-button">
              <FaSearch />
            </button>
          </div>
          <button className="theme-toggle" onClick={toggleDarkMode}>
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
        </div>
        {successMessage && <div className="notification success">{successMessage}</div>}
        {errorMessage && <div className="notification error">{errorMessage}</div>}
      </nav>
      
      <Dialog
        setSuccessMessage={setSuccessMessage}
        onAddTask={(newTask) => handleSubmit({ preventDefault: () => {} }, newTask)}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        db={db}
      />
    </>
  );
};

export default NavBar;

