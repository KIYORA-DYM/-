// Same-origin "/api" works for the production build (client is served by
// the same Express server). Local dev overrides this via client/.env.
const API_URL = import.meta.env.VITE_API_URL || "/api";

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `リクエストに失敗しました (${res.status})`);
  }
  return data;
}

export const api = {
  register: (body) => request("/auth/register", { method: "POST", body }),
  login: (body) => request("/auth/login", { method: "POST", body }),
  getUsers: (token) => request("/users", { token }),
  getPendingUsers: (token) => request("/users/pending", { token }),
  approveUser: (token, id) => request(`/users/${id}/approve`, { method: "POST", token }),
  rejectUser: (token, id) => request(`/users/${id}/reject`, { method: "POST", token }),
  getTasks: (token, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/tasks${qs ? `?${qs}` : ""}`, { token });
  },
  createTask: (token, body) => request("/tasks", { method: "POST", body, token }),
  updateTask: (token, id, body) => request(`/tasks/${id}`, { method: "PATCH", body, token }),
  deleteTask: (token, id) => request(`/tasks/${id}`, { method: "DELETE", token }),

  getAllActions: (token, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/actions${qs ? `?${qs}` : ""}`, { token });
  },
  getTaskActions: (token, taskId) => request(`/actions/task/${taskId}`, { token }),
  createAction: (token, taskId, body) =>
    request(`/actions/task/${taskId}`, { method: "POST", body, token }),
  updateAction: (token, id, body) => request(`/actions/${id}`, { method: "PATCH", body, token }),
  deleteAction: (token, id) => request(`/actions/${id}`, { method: "DELETE", token }),

  getAnnouncements: (token) => request("/announcements", { token }),
  createAnnouncement: (token, body) => request("/announcements", { method: "POST", body, token }),
  deleteAnnouncement: (token, id) => request(`/announcements/${id}`, { method: "DELETE", token }),

  getMinutes: (token, taskId) => request(`/minutes/task/${taskId}`, { token }),
  createMinutes: (token, taskId, body) =>
    request(`/minutes/task/${taskId}`, { method: "POST", body, token }),
  deleteMinutes: (token, id) => request(`/minutes/${id}`, { method: "DELETE", token }),

  getSummary: (token) => request("/summary", { token }),

  getTodos: (token) => request("/todos", { token }),
  createTodo: (token, body) => request("/todos", { method: "POST", body, token }),
  updateTodo: (token, id, body) => request(`/todos/${id}`, { method: "PATCH", body, token }),
  deleteTodo: (token, id) => request(`/todos/${id}`, { method: "DELETE", token }),
};
