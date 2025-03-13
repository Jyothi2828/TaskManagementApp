# [View Live App](https://jyothi2828.github.io/TaskManagementApp/)

## Features of the Task Management App ✨

- **📝 Task Creation**: Users can create new tasks with titles and descriptions.
- **✏️ Task Editing**: Users can edit existing tasks, allowing them to update the title and description.
- **🗑️ Task Deletion**: Users can delete tasks they no longer need.
- **✅ Task Completion**: Users can mark tasks as complete or incomplete, providing a visual indication of task status.
- **⏳ Time Tracking**: The app tracks the time elapsed since task creation and the time taken to complete tasks.
- **📱 Responsive Design**: The app is designed to be responsive, ensuring usability across different devices.
- **💾 Persistent Storage**: Tasks and user preferences are stored in IndexedDB, allowing data to persist even after the app is closed or refreshed.
- **🔔 User Notifications**: The app provides feedback to users through notifications for actions like task creation, editing, and deletion.

# React Task Manager ⚙️

This project uses several React hooks to manage state and optimize performance.

## Hooks used in this App and How they are used 🧑‍💻

### `useContext` 🧩
- **Purpose**: Allows components to share state and functions without passing props through multiple levels. It helps in decoupling the logic and separating state management from UI components.
- **Example Usage**: 
    In the `TaskItem` component, `useContext` is used to access task management functions like `toggleTask`, `deleteTask`, and `editTask`.

### `useState` 💬
- **Purpose**: Manages local state within components.
- **Example Usage**: 
    ```javascript
    const [darkMode, setDarkMode] = useState(false); // Manages theme state
    ```

### `useEffect` 🔄
- **Purpose**: Handles side effects like data fetching or saving changes. It runs after the render and can be used to fetch tasks or save them to local storage when tasks or theme change.
- **Example Usage**: 
    ```javascript
    useEffect(() => {
        // Fetch tasks or save to local storage
    }, [tasks, theme]);
    ```

### `useReducer` ⚙️
- **Purpose**: Manages complex state transitions. It is useful for tasks like managing a list of tasks where multiple operations (add, delete, toggle) need to be handled efficiently.
- **Example Usage**:
    ```javascript
    const [tasks, dispatch] = useReducer(taskReducer, []);
    ```

### `useRef` 🔗
- **Purpose**: Allows you to access DOM elements or store mutable values without triggering re-renders.
- **Example Usage**:
    ```javascript
    const windowWidthRef = useRef(window.innerWidth);
    ```

### `useMemo` 🧠
- **Purpose**: Optimizes performance by memoizing expensive calculations. This hook will only recompute the memoized value when one of its dependencies changes.
- **Example Usage**:
    ```javascript
    const filteredTasks = useMemo(() => tasks.filter(task => task.completed), [tasks]);
    ```

### `useCallback` 🔄
- **Purpose**: Memoizes callback functions to prevent unnecessary re-renders.
- **Example Usage**:
    ```javascript
    const handleSearch = useCallback((term) => setSearchTerm(term), []);
    ```

---

# Screenshots of WebApp 🖼️

### WebApp in Light Mode 🌞
[![WebApp in Light Mode](https://github.com/user-attachments/assets/98eeea2b-b6ff-43cf-970f-5ba6beb21310)](https://github.com/user-attachments/assets/98eeea2b-b6ff-43cf-970f-5ba6beb21310)

### WebApp in Dark Mode 🌙
[![WebApp in Dark Mode](https://github.com/user-attachments/assets/e8a68364-9c6d-4096-9d53-43461be776e9)](https://github.com/user-attachments/assets/e8a68364-9c6d-4096-9d53-43461be776e9)

### New Task Added ➕
[![New Task Added](https://github.com/user-attachments/assets/e3b11b6e-ce0a-493f-9781-06a45c9732ae)](https://github.com/user-attachments/assets/e3b11b6e-ce0a-493f-9781-06a45c9732ae)

### Task Details Updation ✏️
[![Task Details Updation](https://github.com/user-attachments/assets/87a3f3ea-81b3-445a-8371-c2a8f0a63afa)](https://github.com/user-attachments/assets/87a3f3ea-81b3-445a-8371-c2a8f0a63afa)

### Adding Task From InProgress to Complete Stage ✅
[![Adding Task From InProgress to Complete](https://github.com/user-attachments/assets/943c14c4-1ed8-442f-992d-5e0f1b7691cf)](https://github.com/user-attachments/assets/943c14c4-1ed8-442f-992d-5e0f1b7691cf)

### Deleting a Task 🗑️
[![Deleting a Task](https://github.com/user-attachments/assets/671272bd-8bcc-43f0-8046-149b92ffac8a)](https://github.com/user-attachments/assets/671272bd-8bcc-43f0-8046-149b92ffac8a)

### Swapping Feature of Tasks 🔄
[![Swapping Feature of Tasks](https://github.com/user-attachments/assets/9eda3232-cc96-401a-8321-998d76504dd1)](https://github.com/user-attachments/assets/9eda3232-cc96-401a-8321-998d76504dd1)

### Task Exists! Rename/Finish Validation 🚨
[![Task Exists! Rename/Finish Validation](https://github.com/user-attachments/assets/dc505c97-f6bf-4a9d-9e9a-8586ea537937)](https://github.com/user-attachments/assets/dc505c97-f6bf-4a9d-9e9a-8586ea537937)

---
