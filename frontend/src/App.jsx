import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import api from "./api";

function AuthPage({ onAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/signup";
      const payload = isLogin ? { email: form.email, password: form.password } : form;
      const { data } = await api.post(endpoint, payload);
      localStorage.setItem("token", data.token);
      onAuth(data.user);
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="card" onSubmit={submit}>
        <h2>{isLogin ? "Login" : "Create account"}</h2>
        {!isLogin && (
          <input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        )}
        <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>{submitting ? "Please wait..." : isLogin ? "Login" : "Signup"}</button>
        {!isLogin && <small>Note: The first account becomes admin automatically.</small>}
        <p>
          {isLogin ? "No account?" : "Already have an account?"}{" "}
          <button type="button" className="link" onClick={() => setIsLogin((v) => !v)}>
            {isLogin ? "Signup" : "Login"}
          </button>
        </p>
      </form>
    </div>
  );
}

function Dashboard({ user, onLogout }) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0 });

  const [projectForm, setProjectForm] = useState({ name: "", description: "" });
  const [taskForm, setTaskForm] = useState({ title: "", description: "", dueDate: "", assigneeId: "" });
  const [memberForm, setMemberForm] = useState({ email: "", role: "MEMBER" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadDashboard = useCallback(async () => {
    const { data } = await api.get("/dashboard");
    setStats(data.stats);
  }, []);

  const loadProjects = useCallback(async () => {
    const { data } = await api.get("/projects");
    setProjects(data);
    if (data.length && !selectedProjectId) {
      setSelectedProjectId(data[0].id);
    }
  }, [selectedProjectId]);

  const loadTasks = async (projectId) => {
    if (!projectId) return;
    const { data } = await api.get(`/tasks/${projectId}`);
    setTasks(data);
  };

  useEffect(() => {
    (async () => {
      await Promise.all([loadDashboard(), loadProjects()]);
    })();
  }, [loadDashboard, loadProjects]);

  useEffect(() => {
    if (!selectedProjectId) return;
    (async () => {
      await loadTasks(selectedProjectId);
    })();
  }, [selectedProjectId]);

  const selectedProject = useMemo(() => projects.find((p) => p.id === selectedProjectId), [projects, selectedProjectId]);
  const members = useMemo(
    () => selectedProject?.memberships.map((m) => m.user) || [],
    [selectedProject]
  );
  const canAdminProject = user.role === "ADMIN" || selectedProject?.memberships.some((m) => m.userId === user.id && m.role === "ADMIN");

  const createProject = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.post("/projects", projectForm);
      setProjectForm({ name: "", description: "" });
      await loadProjects();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create project");
    } finally {
      setBusy(false);
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.post("/tasks", {
        ...taskForm,
        projectId: selectedProjectId,
        dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : undefined,
        assigneeId: taskForm.assigneeId || undefined,
      });
      setTaskForm({ title: "", description: "", dueDate: "", assigneeId: "" });
      await Promise.all([loadTasks(selectedProjectId), loadDashboard()]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create task");
    } finally {
      setBusy(false);
    }
  };

  const addMember = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.post(`/projects/${selectedProjectId}/members`, memberForm);
      setMemberForm({ email: "", role: "MEMBER" });
      await loadProjects();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add member");
    } finally {
      setBusy(false);
    }
  };

  const updateStatus = async (taskId, status) => {
    setError("");
    try {
      await api.patch(`/tasks/${selectedProjectId}/${taskId}/status`, { status });
      await Promise.all([loadTasks(selectedProjectId), loadDashboard()]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    }
  };

  return (
    <div className="dashboard">
      <header className="header">
        <div>
          <h2>Team Task Manager</h2>
          <p>{user.name} ({user.role})</p>
        </div>
        <button onClick={onLogout}>Logout</button>
      </header>
      {error && <p className="error">{error}</p>}

      <section className="stats">
        {Object.entries(stats).map(([k, v]) => (
          <div className="card stat" key={k}><h4>{k}</h4><p>{v}</p></div>
        ))}
      </section>

      <section className="grid">
        <div className="card">
          <h3>Projects</h3>
          <form onSubmit={createProject}>
            <input placeholder="Project name" value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} required />
            <input placeholder="Description" value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} />
            <button disabled={busy}>Create Project</button>
          </form>
          <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="card">
          <h3>Create Task</h3>
          <form onSubmit={createTask}>
            <input placeholder="Task title" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required />
            <input placeholder="Description" value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
            <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
            <select value={taskForm.assigneeId} onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}>
              <option value="">Unassigned</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <button disabled={!selectedProjectId || busy}>Create Task</button>
          </form>
        </div>

        <div className="card">
          <h3>Add Team Member</h3>
          <form onSubmit={addMember}>
            <input type="email" placeholder="Member email" value={memberForm.email} onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })} required />
            <select value={memberForm.role} onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}>
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button disabled={!selectedProjectId || !canAdminProject || busy}>Add Member</button>
          </form>
        </div>
      </section>

      <section className="card">
        <h3>Tasks</h3>
        <div className="tasks">
          {tasks.map((t) => (
            <article key={t.id} className="task">
              <h4>{t.title}</h4>
              <p>{t.description || "No description"}</p>
              <small>Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "n/a"}</small>
              <small>Assignee: {t.assignee?.name || "Unassigned"}</small>
              <select value={t.status} onChange={(e) => updateStatus(t.id, e.target.value)}>
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="DONE">DONE</option>
              </select>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get("/auth/me");
        setUser(data);
      } catch {
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="loading">Loading...</p>;

  return (
    <Routes>
      <Route path="/" element={user ? <Dashboard user={user} onLogout={() => { localStorage.removeItem("token"); setUser(null); }} /> : <AuthPage onAuth={setUser} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
