import { useEffect, useState } from "react";
import "./App.css";
import { supabase } from "./supabaseClient";
import { useAuth, useTheme, useAppData } from "./hooks";
import type { View, TabType, Task, News, UserFile } from "./types";
import {
  rotateImageIfNeeded,
  base64ToBlob,
  generateFileName,
} from "./utils/imageUtils";

// Components
import {
  LoginForm,
  RegisterForm,
  RecoveryForm,
  Header,
  BottomNav,
  LoadingScreen,
  HomeView,
  TasksView,
  DocumentsView,
  NewsView,
  SettingsView,
  TaskModal,
  FileModal,
} from "./components";

function App() {
  const {
    session,
    userData,
    loading: authLoading,
    login,
    register,
    recovery,
    logout,
    updatePassword,
    updateProfile,
    setUserData,
  } = useAuth();
  const { theme, setTheme } = useTheme("light");
  const {
    tasks,
    news,
    personalTasks,
    userFiles,
    completedTasks,
    unlockedTasks,
    loadAppData,
    toggleTask,
    unlockTask,
    addPersonalTask,
    togglePersonalTask,
    deletePersonalTask,
    addUserFile,
    deleteUserFile,
  } = useAppData();

  const [view, setView] = useState<View>("login");
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [selectedTask, setSelectedTask] = useState<
    (Task & { type?: never }) | (News & { type: "news" }) | null
  >(null);
  const [selectedFile, setSelectedFile] = useState<UserFile | null>(null);
  const [loading, setLoading] = useState(false);

  const todayDate = new Date().toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Load app data when user is authenticated
  useEffect(() => {
    if (session?.user && userData) {
      loadAppData(session.user.id, userData.land);
      setView("app");
    } else if (!authLoading && !session) {
      setView("login");
    }
  }, [session, userData, authLoading, loadAppData]);

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!session?.user) return;
    setLoading(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      let base64Image = reader.result as string;

      // Rotate if landscape
      if (file.type.startsWith("image/")) {
        base64Image = await rotateImageIfNeeded(base64Image);
      }

      const blob = await base64ToBlob(base64Image);
      const fileName = generateFileName("Dokument");
      const filePath = `${session.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, blob);

      if (uploadError) {
        alert("Viga: " + uploadError.message);
        setLoading(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(filePath);

      const { data: dbData } = await supabase
        .from("user_files")
        .insert({
          user_id: session.user.id,
          file_name: fileName,
          file_url: publicUrl,
          file_type: "image",
        })
        .select()
        .single();

      if (dbData) {
        addUserFile(dbData);
      }
      setLoading(false);
    };
  };

  // Handle task unlock
  const handleUnlockTask = async (task: Task) => {
    if (!session?.user || !userData) return;

    if (userData.credits < task.price) {
      alert("Pole piisavalt teemante!");
      return;
    }

    if (!confirm(`Avada ${task.price} 💎 eest?`)) return;

    const result = await unlockTask(task, session.user.id, userData.credits);
    if (result) {
      setUserData({ ...userData, credits: result.newCredits });
    }
  };

  // Handle add credits
  const handleAddCredits = async (amount: number) => {
    if (!session?.user || !userData) return;

    const newCredits = userData.credits + amount;
    setUserData({ ...userData, credits: newCredits });
    await supabase
      .from("profiles")
      .update({ credits: newCredits })
      .eq("id", session.user.id);
    alert(`Lisatud +${amount} 💎`);
  };

  // Loading state
  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  // Auth views
  if (view === "login") {
    return (
      <LoginForm
        onLogin={login}
        onSwitchToRegister={() => setView("register")}
        onSwitchToRecovery={() => setView("recovery")}
        loading={authLoading}
      />
    );
  }

  if (view === "register") {
    return (
      <RegisterForm
        onRegister={register}
        onSwitchToLogin={() => setView("login")}
        loading={authLoading}
      />
    );
  }

  if (view === "recovery") {
    return (
      <RecoveryForm
        onRecovery={recovery}
        onSwitchToLogin={() => setView("login")}
      />
    );
  }

  // Main app view
  if (view === "app" && userData) {
    return (
      <div className={`app-main ${theme}-theme`}>
        <Header userData={userData} todayDate={todayDate} />

        <div className="content-scroll">
          {activeTab === "home" && (
            <HomeView
              username={userData.username}
              news={news}
              onNewsClick={(item) => setSelectedTask(item)}
            />
          )}

          {activeTab === "tasks" && (
            <TasksView
              tasks={tasks}
              completedTasks={completedTasks}
              unlockedTasks={unlockedTasks}
              onTaskClick={(task) => setSelectedTask(task)}
              onToggleTask={(taskId) => toggleTask(taskId, session.user.id)}
            />
          )}

          {activeTab === "portfolio" && (
            <DocumentsView
              userFiles={userFiles}
              personalTasks={personalTasks}
              onFileSelect={handleFileUpload}
              onFileClick={(file) => setSelectedFile(file)}
              onAddPersonalTask={(title) =>
                addPersonalTask(session.user.id, title)
              }
              onTogglePersonalTask={togglePersonalTask}
              onDeletePersonalTask={deletePersonalTask}
            />
          )}

          {activeTab === "news" && (
            <NewsView
              news={news}
              onNewsClick={(item) => setSelectedTask(item)}
            />
          )}

          {activeTab === "menu" && (
            <SettingsView
              userData={userData}
              theme={theme}
              onThemeChange={setTheme}
              onUpdateProfile={updateProfile}
              onUpdatePassword={updatePassword}
              onAddCredits={handleAddCredits}
              onLogout={logout}
            />
          )}
        </div>

        {/* Modals */}
        {selectedFile && (
          <FileModal
            file={selectedFile}
            onClose={() => setSelectedFile(null)}
            onDelete={deleteUserFile}
          />
        )}

        {selectedTask && (
          <TaskModal
            task={selectedTask}
            unlockedTasks={unlockedTasks}
            onClose={() => setSelectedTask(null)}
            onUnlock={handleUnlockTask}
          />
        )}

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  return null;
}

export default App;
