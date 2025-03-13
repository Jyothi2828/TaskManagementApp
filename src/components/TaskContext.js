import React, { createContext, useState, useReducer, useCallback, useRef } from 'react';
import { openDB } from 'idb'; // Import idb for IndexedDB interactions

// Reducer for tasks
const taskReducer = (state, action) => {
    switch (action.type) {
        case 'SET_TASKS':
            return action.payload;
        case 'ADD_TASK':
            return [...state, action.payload];
        case 'EDIT_TASK':
            return state.map(task =>
                task.id === action.payload.id
                    ? { ...task, ...action.payload, readdedAt: action.payload.readdedAt || task.readdedAt }
                    : task
            );
        case 'DELETE_TASK':
            return state.filter(task => task.id !== action.payload);
        default:
            return state;
    }
};

export const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
    const [tasks, dispatch] = useReducer(taskReducer, []);
    const [searchTerm, setSearchTerm] = useState('');
    const [notificationMessage, setNotificationMessage] = useState('');
    const [alertInfo, setAlertInfo] = useState({ show: false, taskId: null, taskTitle: '' });
    const dbRef = useRef(null); // Ref to hold the IndexedDB instance

    const notificationTimeoutRef = useRef(null);

    const showNotification = useCallback((message) => {
        setNotificationMessage(message);
        if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current);
        }
        notificationTimeoutRef.current = setTimeout(() => setNotificationMessage(''), 2000);
    }, []);

    const handleSearch = useCallback((term) => setSearchTerm(term), []);

    // Initialize IndexedDB (called from App.js)
    const initializeDB = useCallback(async () => {
        dbRef.current = await openDB('AppDB', 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('tasks')) {
                    db.createObjectStore('tasks', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('preferences')) {
                    db.createObjectStore('preferences');
                }
            },
        });
        return dbRef.current; // Return the db instance for immediate use in loading data
    }, []);

    // Load tasks from IndexedDB
    const loadTasksFromDB = useCallback(async (db) => {
        if (!db) return [];
        return await db.getAll('tasks');
    }, []);

    // Get a task by name
    const getTaskByName = useCallback((taskName) => {
        return tasks.find(task => task.title === taskName);
    }, [tasks]);

    // Add or re-add task to IndexedDB and state
    const addTask = useCallback(async (newTask) => {
        const db = dbRef.current;
        if (!db) return;

        const tx = db.transaction('tasks', 'readwrite');
        const store = tx.objectStore('tasks');

        // Check if the task already exists
        const existingTask = await store.get(newTask.id);

        let taskWithTimestamps = { ...newTask };

        if (existingTask) {
            // Task exists, update it
            taskWithTimestamps.createdAt = existingTask.createdAt; // Keep the original creation date
            taskWithTimestamps.readdedAt = new Date().toISOString(); // Only set readdedAt timestamp
            await store.put(taskWithTimestamps);
            dispatch({ type: 'EDIT_TASK', payload: taskWithTimestamps });
            showNotification('Task re-added! Time for a fresh start 🔄🌱');
        } else {
            // New task, add it
            taskWithTimestamps.createdAt = new Date().toISOString(); // Only set createdAt timestamp
            await store.add(taskWithTimestamps);
            dispatch({ type: 'ADD_TASK', payload: taskWithTimestamps });
            showNotification('New task alert! 🎉🔔');
        }

        await tx.done;
    }, [showNotification]);

    // Add or re-add task by name (wrapper function)
    const addTaskByName = useCallback(async (newTaskData) => {
        const existingTask = tasks.find(t => t.title === newTaskData.title);
        if (existingTask) {
            // If task with same name exists, use its ID for re-adding
            await addTask({ ...newTaskData, id: existingTask.id });
        } else {
            // Otherwise create a new task with a generated ID
            const newId = Date.now().toString();
            await addTask({ ...newTaskData, id: newId });
        }
    }, [tasks, addTask]);

    // Edit task by ID (original function)
    const editTask = useCallback(async (taskId, newTitle, newDescription) => {
        const db = dbRef.current;
        if (!db) return;

        const updatedTask = {
            id: taskId,
            title: newTitle,
            description: newDescription,
            modifiedAt: new Date().toISOString() // Only set modifiedAt timestamp
        };

        const tx = db.transaction('tasks', 'readwrite');
        const taskToUpdate = await tx.store.get(taskId);
        if (taskToUpdate) {
            const mergedTask = { ...taskToUpdate, ...updatedTask }; // Keep existing properties
            await tx.store.put(mergedTask);
            await tx.done;

            dispatch({ type: 'EDIT_TASK', payload: mergedTask });
            showNotification('Task revised and ready! ✏️👌');
        } else {
            console.warn(`Task with id ${taskId} not found in DB`);
        }
    }, [showNotification]);

    // Edit task by name
    const editTaskByName = useCallback(async (taskName, newTitle, newDescription) => {
        const db = dbRef.current;
        if (!db) return;
        
        // First, find the task by name
        const taskToEdit = tasks.find(t => t.title === taskName);
        
        if (!taskToEdit) {
            showNotification(`Task "${taskName}" not found ❌`);
            return;
        }
        
        const updatedTask = {
            id: taskToEdit.id, // We still need the ID for the database
            title: newTitle,
            description: newDescription,
            modifiedAt: new Date().toISOString() // Only set modifiedAt timestamp
        };
        
        const tx = db.transaction('tasks', 'readwrite');
        const taskToUpdate = await tx.store.get(taskToEdit.id);
        
        if (taskToUpdate) {
            const mergedTask = { ...taskToUpdate, ...updatedTask }; // Keep existing properties
            await tx.store.put(mergedTask);
            await tx.done;
            
            dispatch({ type: 'EDIT_TASK', payload: mergedTask });
            showNotification('Task refreshed! All up to date now 🔄😊');
        } else {
            console.warn(`Task "${taskName}" not found in DB`);
        }
    }, [tasks, showNotification]);

    // Toggle task completion by ID (original function)
    const toggleTask = useCallback(async (taskId) => {
        const db = dbRef.current;
        if (!db) return;

        const tx = db.transaction('tasks', 'readwrite');
        const taskToToggle = await tx.store.get(taskId);

        if (taskToToggle) {
            const toggledTask = {
                ...taskToToggle,
                completed: !taskToToggle.completed,
                completedAt: !taskToToggle.completed ? new Date().toISOString() : null,
                modifiedAt: new Date().toISOString()
            };

            await tx.store.put(toggledTask);
            await tx.done;

            dispatch({ type: 'EDIT_TASK', payload: toggledTask });

            showNotification(
                !taskToToggle.completed
                    ? 'Task accomplished! 🎉😎'
                    : 'Task reopened. Let\'s tackle it again! 💪😊'
            );
            
        }
    }, [showNotification]);

    // Toggle task completion by name
    const toggleTaskByName = useCallback(async (taskName) => {
        const db = dbRef.current;
        if (!db) return;
        
        // First, find the task by name
        const taskToToggle = tasks.find(t => t.title === taskName);
        
        if (!taskToToggle) {
            showNotification(`Task "${taskName}" not found ❌`);
            return;
        }
        
        const tx = db.transaction('tasks', 'readwrite');
        const taskFromDB = await tx.store.get(taskToToggle.id);
        
        if (taskFromDB) {
            const toggledTask = {
                ...taskFromDB,
                completed: !taskFromDB.completed,
                completedAt: !taskFromDB.completed ? new Date().toISOString() : null,
                modifiedAt: new Date().toISOString()
            };
            
            await tx.store.put(toggledTask);
            await tx.done;
            
            dispatch({ type: 'EDIT_TASK', payload: toggledTask });
            
            showNotification(
                !taskToToggle.completed
                    ? 'Task accomplished! 🎉😎'
                    : 'Task reopened. Let\'s tackle it again! 💪😊'
            );
            
        }
    }, [tasks, showNotification]);

    // Delete task by ID (original function)
    const deleteTask = useCallback((taskId) => {
        const taskToDelete = tasks.find(t => t.id === taskId);
        if (taskToDelete) {
            setAlertInfo({
                show: true,
                taskId,
                taskTitle: taskToDelete.title,
            });
        } else {
            showNotification(`Task with ID ${taskId} not found ❌`);
        }
    }, [tasks, showNotification]);

    // Delete task by name
    const deleteTaskByName = useCallback((taskName) => {
        const taskToDelete = tasks.find(t => t.title === taskName);
        
        if (taskToDelete) {
            setAlertInfo({
                show: true,
                taskId: taskToDelete.id, // We still need the ID for the actual deletion
                taskTitle: taskToDelete.title,
            });
        } else {
            showNotification(`Task "${taskName}" not found ❌`);
        }
    }, [tasks, showNotification]);

    const handleConfirmDelete = useCallback(async () => {
        if (alertInfo.taskId) {
            const db = dbRef.current;
            if (!db) return;

            const tx = db.transaction('tasks', 'readwrite');
            await tx.store.delete(alertInfo.taskId);
            await tx.done;

            dispatch({ type: 'DELETE_TASK', payload: alertInfo.taskId });
            showNotification('Abracadabra! Task disappeared! ✨🔮🗑️');
        }
        setAlertInfo({ show: false, taskId: null, taskTitle: '' });
    }, [alertInfo, showNotification]);

    const handleCancelDelete = useCallback(() => {
        setAlertInfo({ show: false, taskId: null, taskTitle: '' });
        showNotification('Deletion undone! Task is safe for now 😌❌');
    }, [showNotification]);

    const setTasks = useCallback((newTasks) => {
        dispatch({ type: 'SET_TASKS', payload: newTasks });
    }, []);

    const contextValue = {
        tasks,
        searchTerm,
        notificationMessage,
        alertInfo,
        handleSearch,
        addTask,
        addTaskByName,
        editTask,
        editTaskByName,
        toggleTask,
        toggleTaskByName,
        deleteTask,
        deleteTaskByName,
        getTaskByName,
        handleConfirmDelete,
        handleCancelDelete,
        setTasks,
        initializeDB, // Expose initializeDB to App.js
        loadTasksFromDB, // Expose loadTasksFromDB to App.js
    };

    return (
        <TaskContext.Provider value={contextValue}>
            {children}
        </TaskContext.Provider>
    );
};