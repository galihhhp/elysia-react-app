import { loadConfig } from "../config";

export interface Task {
  id: number;
  task: string;
}

export const fetchMessage = async (): Promise<string> => {
  const config = await loadConfig();
  const response = await fetch(`${config.apiUrl}/`);
  if (!response.ok) {
    throw new Error("Failed to fetch message");
  }
  return response.text();
};

export const fetchTasks = async (): Promise<Task[]> => {
  const config = await loadConfig();
  const response = await fetch(`${config.apiUrl}/tasks`);
  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }
  const data = await response.json();
  return data.tasks;
};

export const createTask = async (task: string): Promise<void> => {
  const config = await loadConfig();
  const response = await fetch(`${config.apiUrl}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ task }),
  });
  if (!response.ok) {
    throw new Error("Failed to create task");
  }
};
export const editTask = async (id: number, task: string): Promise<void> => {
  const config = await loadConfig();
  if (config.featureEditTask !== true)
    throw new Error("Edit task feature is disabled");
  const response = await fetch(`${config.apiUrl}/tasks/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ task }),
  });
  if (!response.ok) {
    throw new Error("Failed to edit task");
  }
};
export const deleteTask = async (id: number): Promise<void> => {
  const config = await loadConfig();
  if (config.featureDeleteTask !== true)
    throw new Error("Delete task feature is disabled");
  const response = await fetch(`${config.apiUrl}/tasks/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete task");
  }
};
