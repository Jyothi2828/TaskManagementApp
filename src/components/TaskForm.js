import React, { useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const TaskForm = ({ onAddTask, tasks, db }) => {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Check if a task with the same title already exists
    const existingTask = tasks.find(task => task.title.toLowerCase() === title.toLowerCase());
    if (existingTask) {
      if (existingTask.completed) {
        setErrorMessage(`Task "${title}" is already completed! You can redo it ⟳.`);
      } else {
        setErrorMessage('Task exists! Rename/Finish!');
      }
      return; // Prevent form submission if a duplicate task is found
    }

    // Check in IndexedDB if the task is already completed
    if (db) {
      const tx = db.transaction('tasks', 'readonly');
      const store = tx.objectStore('tasks');
      const indexedTask = await store.getAll();
      const foundCompletedTask = indexedTask.find(
        task => task.title.toLowerCase() === title.toLowerCase() && task.completed
      );

      if (foundCompletedTask) {
        setErrorMessage(`Task "${title}" is already completed in the database! You can redo it ⟳.`);
        return; // Prevent adding a duplicate completed task
      }
    }

    // Create a new task object
    const newTask = {
      id: Date.now(),
      title,
      description,
      completed: false,
    };

    // Add task via onAddTask callback
    onAddTask(newTask);

    setTitle('');
    setDescription('');
    setShowForm(false);
    setErrorMessage(''); // Clear error message when task is successfully added
  };

  // Calculate task statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const remainingTasks = totalTasks - completedTasks;

  // Prepare data for pie chart
  const chartData = {
    labels: ['Completed Tasks', 'Remaining Tasks'],
    datasets: [
      {
        data: [completedTasks, remainingTasks],
        backgroundColor: ['#B6E9C2', '#D68D8E'],
        hoverBackgroundColor: ['#B6E9C2', '#D68D8E'],
      },
    ],
  };

  return (
    <div className="task-manager">
      <button onClick={() => setShowForm(!showForm)} className="add-task-btn">
        {showForm ? 'Cancel' : 'Add New Task'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="task-form">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            required
          />
          {errorMessage && <div className="error-message">{errorMessage}</div>}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Task description"
          />
          <button type="submit">Add Task</button>
        </form>
      )}

      <div className="task-summary">
        <h3>Task Summary</h3>
        <div className="summary-stats">
          <span>Total: {totalTasks}</span>
          <span>Completed: {completedTasks}</span>
          <span>Remaining: {remainingTasks}</span>
        </div>
        <div style={{ width: '300px', height: '300px', margin: '0 auto' }}>
          <Pie data={chartData} />
        </div>
      </div>
    </div>
  );
};

export default TaskForm;

