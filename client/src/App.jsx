import { AuthProvider, useAuth } from "./context/AuthContext";
import { AuthPage } from "./components/AuthPage";
import { AppShell } from "./components/AppShell";

function AppContent() {
  const { token } = useAuth();
  return token ? <AppShell /> : <AuthPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
