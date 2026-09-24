import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { QuickAddWizard } from "./QuickAddWizard";

export function AddIssueView({ onNavigate }) {
  const { token } = useAuth();
  const [error, setError] = useState("");

  async function handleCreate(taskInput) {
    try {
      await api.createTask(token, taskInput);
      onNavigate("home");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="view">
      <header className="view-header">
        <h1>課題の追加</h1>
      </header>

      {error && <p className="error-text">{error}</p>}

      <div className="card-panel">
        <QuickAddWizard onSubmit={handleCreate} onCancel={() => onNavigate("home")} />
      </div>
    </div>
  );
}
