import { useState, useEffect } from "react";
import "./App.css";
import { useTaskManager } from "./hooks/useTaskManager";
import { loadConfig } from "./config";

const VERSION = import.meta.env.VITE_APP_VERSION;

function App() {
  const {
    message,
    tasks,
    newTask,
    setNewTask,
    error,
    handleCreateTask,
    getTasks,
    editTaskId,
    editTaskValue,
    setEditTaskValue,
    startEditTask,
    cancelEditTask,
    handleEditTask,
    handleDeleteTask,
  } = useTaskManager();
  const [featureEditTask, setFeatureEditTask] = useState(false);
  const [featureDeleteTask, setFeatureDeleteTask] = useState(false);

  useEffect(() => {
    loadConfig().then((cfg) => {
      setFeatureEditTask(cfg.featureEditTask);
      setFeatureDeleteTask(cfg.featureDeleteTask);
    });
    getTasks();
  }, [getTasks]);

  return (
    <>
      <h1>Task Manager</h1>
      <p>{message ?? ""}</p>
      <p>{error ?? ""}</p>

      <div className="card">
        <form onSubmit={handleCreateTask}>
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a new task"
            aria-label="New task input"
          />
          <button type="submit">Add Task</button>
        </form>
      </div>

      <h2>Tasks</h2>
      <ul>
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <li key={task.id}>
              {editTaskId === task.id ? (
                <>
                  <input
                    type="text"
                    value={editTaskValue}
                    onChange={(e) => setEditTaskValue(e.target.value)}
                    aria-label="Edit task input"
                    autoFocus
                  />
                  <button onClick={() => handleEditTask(task.id)} type="button">
                    Save
                  </button>
                  <button onClick={cancelEditTask} type="button">
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  {task.task}
                  {featureEditTask && (
                    <button
                      onClick={() => startEditTask(task.id, task.task)}
                      type="button"
                      style={{ marginLeft: 8 }}>
                      Edit
                    </button>
                  )}
                  {featureDeleteTask && (
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      type="button"
                      style={{ marginLeft: 8 }}>
                      Delete
                    </button>
                  )}
                </>
              )}
            </li>
          ))
        ) : (
          <li>No tasks yet.</li>
        )}
      </ul>
      <footer style={{ marginTop: 32, opacity: 0.6, fontSize: 14 }}>
        Frontend version: {VERSION}
      </footer>
    </>
  );
}

export default App;
