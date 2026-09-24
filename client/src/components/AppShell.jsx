import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { Sidebar } from "./Sidebar";
import { AnnouncementBar } from "./AnnouncementBar";
import { HomeView } from "./HomeView";
import { AddIssueView } from "./AddIssueView";
import { BoardView } from "./BoardView";
import { GanttView } from "./GanttView";
import { CalendarView } from "./CalendarView";
import { ExistingClientsView } from "./ExistingClientsView";
import { SettingsView } from "./SettingsView";

export function AppShell() {
  const { token } = useAuth();
  const [activeView, setActiveView] = useState("home");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.getUsers(token).then(setUsers).catch(() => {});
  }, [token]);

  return (
    <div className="app-root">
      <AnnouncementBar users={users} />
      <div className="app-shell">
        <Sidebar activeView={activeView} onNavigate={setActiveView} />
        <main className="app-main">
          {activeView === "home" && <HomeView users={users} onNavigate={setActiveView} />}
          {activeView === "add" && <AddIssueView users={users} onNavigate={setActiveView} />}
          {activeView === "board" && <BoardView users={users} />}
          {activeView === "gantt" && <GanttView users={users} />}
          {activeView === "calendar" && <CalendarView users={users} />}
          {activeView === "clients" && <ExistingClientsView users={users} onNavigate={setActiveView} />}
          {activeView === "settings" && <SettingsView users={users} />}
        </main>
      </div>
    </div>
  );
}
