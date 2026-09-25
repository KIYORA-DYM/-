import { useCallback, useEffect, useState } from "react";
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
import { NextActionsView } from "./NextActionsView";
import { TodoView } from "./TodoView";
import { MemoView } from "./MemoView";
import { SettingsView } from "./SettingsView";
import { MemberActivityView } from "./MemberActivityView";

const EMPTY_SUMMARY = {
  overdueFollowUps: [],
  upcomingFollowUps: [],
  overdueDueTasks: [],
  overdueActions: [],
  announcements: [],
};

export function AppShell() {
  const { token, user } = useAuth();
  const [activeView, setActiveView] = useState("home");
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);

  const loadUsers = useCallback(() => {
    api.getUsers(token).then(setUsers).catch(() => {});
  }, [token]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Shared across AnnouncementBar + HomeView so opening the app costs one
  // batched round trip instead of both fetching their own overlapping data.
  const refreshSummary = useCallback(async () => {
    try {
      setSummary(await api.getSummary(token));
    } catch {
      // leave the previous summary in place on a transient failure
    }
  }, [token]);

  useEffect(() => {
    refreshSummary();
  }, [refreshSummary]);

  return (
    <div className="app-root">
      <AnnouncementBar summary={summary} onRefresh={refreshSummary} />
      <div className="app-shell">
        <Sidebar activeView={activeView} onNavigate={setActiveView} />
        <main className="app-main">
          {activeView === "home" && (
            <HomeView onNavigate={setActiveView} summary={summary} onMutate={refreshSummary} />
          )}
          {activeView === "actions" && <NextActionsView />}
          {activeView === "todo" && <TodoView />}
          {activeView === "memo" && <MemoView />}
          {activeView === "add" && <AddIssueView onNavigate={setActiveView} />}
          {activeView === "board" && <BoardView />}
          {activeView === "gantt" && <GanttView />}
          {activeView === "calendar" && <CalendarView />}
          {activeView === "clients" && <ExistingClientsView />}
          {activeView === "members" && user?.is_admin && <MemberActivityView />}
          {activeView === "settings" && <SettingsView users={users} onUsersChange={loadUsers} />}
        </main>
      </div>
    </div>
  );
}
