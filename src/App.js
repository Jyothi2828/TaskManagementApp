import React, { useState, useEffect, useReducer, useRef, useMemo, useCallback, useLayoutEffect } from 'react';
import { openDB } from 'idb'; // Import idb for IndexedDB interactions
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import NavBar from './components/NavBar';
import CustomAlert from './components/CustomAlert';
import './styles/App.css';
import './styles/CustomAlert.css';
import './styles/TaskForm.css';
import './styles/TaskList.css';
import quotes from '../src/utils/quotes.json'; // Import the quotes from JSON file


// Create a context for theme
const ThemeContext = React.createContext();

// Reducer for tasks
const taskReducer = (state, action) => {
  switch (action.type) {
    case 'SET_TASKS':
      return action.payload;
    case 'ADD_TASK':
      return [...state, action.payload];
    case 'EDIT_TASK':
      return state.map(task => task.id === action.payload.id ? { ...task, ...action.payload } : task);
    case 'TOGGLE_TASK':
      return state.map(task =>
        task.id === action.payload
          ? { ...task, completed: !task.completed, completedAt: !task.completed ? new Date().toISOString() : null, modifiedAt: new Date().toISOString() }
          : task
      );
    case 'DELETE_TASK':
      return state.filter(task => task.id !== action.payload);
    default:
      return state;
  }
};
const getRandomQuote = () => {
  const randomIndex = Math.floor(Math.random() * quotes.quotes.length);
  return quotes.quotes[randomIndex];
};
const initDB = async () => {
  return openDB('AppDB', 2, { // Increment the version number
    upgrade(db, oldVersion, newVersion, transaction) {
      if (!db.objectStoreNames.contains('tasks')) {
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('title', 'title', { unique: false });
      } else {
        // If 'tasks' store exists but 'title' index doesn't
        const taskStore = transaction.objectStore('tasks');
        if (!taskStore.indexNames.contains('title')) {
          taskStore.createIndex('title', 'title', { unique: false });
        }
      }
    },
  });
};

function App() {
  const [tasks, dispatch] = useReducer(taskReducer, []);
  const [darkMode, setDarkMode] = useState(false); // Theme state
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [alertInfo, setAlertInfo] = useState({ show: false, taskId: null, taskTitle: '' });

  const windowWidthRef = useRef(window.innerWidth);
  const notificationTimeoutRef = useRef(null);
  const dbRef = useRef(null);

  // Initialize IndexedDB and load data on mount
  useEffect(() => {
    const setupDB = async () => {
      dbRef.current = await initDB();

      // Load tasks from IndexedDB
      const allTasks = await dbRef.current.getAll('tasks');
      dispatch({ type: 'SET_TASKS', payload: allTasks });

      // Load theme preference from IndexedDB
      const storedTheme = await dbRef.current.get('preferences', 'theme');
      if (storedTheme !== undefined) {
        setDarkMode(storedTheme);
      }
    };
    setupDB();
  }, []);

  // Save tasks to IndexedDB whenever they change
  useEffect(() => {
    const saveTasksToDB = async () => {
      if (dbRef.current) {
        const tx = dbRef.current.transaction('tasks', 'readwrite');
        const store = tx.objectStore('tasks');
        await Promise.all(tasks.map(task => store.put(task)));
        await tx.done;
      }
    };
    saveTasksToDB();
  }, [tasks]);

  // Save theme preference to IndexedDB whenever it changes
  useEffect(() => {
    const saveThemeToDB = async () => {
      if (dbRef.current) {
        await dbRef.current.put('preferences', darkMode, 'theme');
      }
    };
    saveThemeToDB();
  }, [darkMode]);

  // Handle window resize using useLayoutEffect
  useLayoutEffect(() => {
    const handleResize = () => {
      windowWidthRef.current = window.innerWidth;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const onReorderTasks = useCallback((draggedTask, targetTask) => {
    const draggedIndex = tasks.findIndex(task => task.id === draggedTask.id);
    const targetIndex = tasks.findIndex(task => task.id === targetTask.id);
    
    if (draggedIndex === -1 || targetIndex === -1) return;

    const updatedTasks = [...tasks];
    updatedTasks.splice(draggedIndex, 1);
    updatedTasks.splice(targetIndex, 0, draggedTask);

    dispatch({ type: 'SET_TASKS', payload: updatedTasks });
  }, [tasks]);

  const handleSearch = useCallback((term) => setSearchTerm(term), []);

  const showNotification = useCallback((message) => {
    setNotificationMessage(message);
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    notificationTimeoutRef.current = setTimeout(() => setNotificationMessage(''), 4000);
  }, []);

  const addTask = useCallback(async (newTask) => {
    const taskWithTimestamps = {
      ...newTask,
      createdAt: new Date().toISOString(),
    };

    try {
      if (dbRef.current) {
        const tx = dbRef.current.transaction('tasks', 'readwrite');
        const store = tx.objectStore('tasks');
        await store.add(taskWithTimestamps);
        await tx.done;
      }
      dispatch({ type: 'ADD_TASK', payload: taskWithTimestamps });

      // Check if the added task is completed
      if (newTask.completed) {
        showNotification('Task finished! You can redo it from the completed tasks list ⟳');
      } else {
        showNotification('Task added! All set!');
      }
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  }, [dispatch, showNotification]);

  const editTask = useCallback((taskId, newTitle, newDescription) => {
    dispatch({ type: 'EDIT_TASK', payload: { id: taskId, title: newTitle, description: newDescription, modifiedAt: new Date().toISOString() } });
    showNotification('Task updated! All fresh now ✏️🔄');
  }, [showNotification]);

  const toggleTask = useCallback((taskId) => {
    dispatch({ type: 'TOGGLE_TASK', payload: taskId });
    const task = tasks.find((t) => t.id === taskId);
    showNotification(
      !task?.completed
        ? `Well done! Task completed! 🎉✔️`
        : `Task reopened! Let's tackle it again! ↩️💪`
    );
    
  }, [tasks, showNotification]);

  const deleteTask = useCallback((taskId) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    setAlertInfo({
      show: true,
      taskId,
      taskTitle: taskToDelete.title,
    });
  }, [tasks]);

  const handleConfirmDelete = useCallback(async () => {
    if (alertInfo.taskId && dbRef.current) {
      // Delete task from IndexedDB
      const tx = dbRef.current.transaction('tasks', 'readwrite');
      const store = tx.objectStore('tasks');
      await store.delete(alertInfo.taskId);
      await tx.done;

      // Update state
      dispatch({ type: 'DELETE_TASK', payload: alertInfo.taskId });
      showNotification(`Task "${alertInfo.taskTitle}" is gone! 👋🗑️`);
    }
    setAlertInfo({ show: false, taskId: null, taskTitle: '' });
  }, [alertInfo, showNotification]);

  const handleCancelDelete = useCallback(() => {
    setAlertInfo({ show: false, taskId: null, taskTitle: '' });
    showNotification('Deletion canceled successfully! 👍');
  }, [showNotification]);

  const filteredTasks = useMemo(() =>
    tasks.filter(task =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase())
    ), [tasks, searchTerm]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prevMode => !prevMode);
  }, []);


const inProgressCount = tasks.filter(task => !task.completed).length;
const completedCount = tasks.filter(task => task.completed).length;

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <div className={`app-wrapper ${darkMode ? 'dark' : ''}`}>
        <NavBar 
          darkMode={darkMode} 
          toggleDarkMode={toggleDarkMode} 
          onSearch={handleSearch}
          onAddTask={addTask}
          windowWidth={windowWidthRef.current}
          db={dbRef.current}
        />

        {notificationMessage && (
          <div className={`notification ${notificationMessage ? 'show' : ''}`}>
            {notificationMessage}
          </div>
        )}

        {alertInfo.show && (
          <CustomAlert
            message={`Are you sure you want to delete "${alertInfo.taskTitle}"?`}
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
          />
        )}

        <main className="main-content">
          <div className="container">
            <div className="task-container">
              <TaskForm onAddTask={addTask} tasks={tasks} />

              <div className="in-progress-tasks">
                <h2>In Progress Tasks - {inProgressCount}</h2>
                <TaskList
                  tasks={filteredTasks.filter(task => !task.completed)}
                  onToggleTask={toggleTask}
                  onDeleteTask={deleteTask}
                  onEditTask={editTask}
                  onReorderTasks={onReorderTasks}
                />
              </div>

              <div className="completed-tasks">
                <h2>Completed Tasks - {completedCount}</h2>
                <TaskList
                  tasks={filteredTasks.filter(task => task.completed)}
                  onToggleTask={toggleTask}
                  onDeleteTask={deleteTask}
                  onEditTask={editTask}
                  onReorderTasks={onReorderTasks}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
      <div className="random-quote">
        <p>{getRandomQuote()}</p>
      </div>

    </ThemeContext.Provider>
    
  );
}

export default App;

