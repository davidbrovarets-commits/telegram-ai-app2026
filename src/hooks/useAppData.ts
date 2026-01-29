import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import type { Task, News, PersonalTask, UserFile } from '../types';
import { BACKUP_TASKS, BACKUP_NEWS } from '../utils/constants';

interface UseAppDataReturn {
    // Data
    tasks: Task[];
    news: News[];
    personalTasks: PersonalTask[];
    userFiles: UserFile[];
    completedTasks: string[];
    unlockedTasks: string[];

    // Actions
    loadAppData: (userId: string, userLand: string, userCity?: string) => Promise<void>;
    toggleTask: (taskId: string, userId: string) => Promise<void>;
    unlockTask: (task: Task, userId: string, currentCredits: number) => Promise<{ newCredits: number } | null>;

    // Personal tasks
    addPersonalTask: (userId: string, title: string) => Promise<void>;
    togglePersonalTask: (task: PersonalTask) => Promise<void>;
    deletePersonalTask: (id: number) => Promise<void>;

    // Files
    addUserFile: (file: UserFile) => void;
    deleteUserFile: (fileId: number) => Promise<void>;

    // State setters
    setCompletedTasks: React.Dispatch<React.SetStateAction<string[]>>;
    setUnlockedTasks: React.Dispatch<React.SetStateAction<string[]>>;
}

export const useAppData = (): UseAppDataReturn => {
    const [tasks, setTasks] = useState<Task[]>(BACKUP_TASKS);
    const [news, setNews] = useState<News[]>(BACKUP_NEWS);
    const [personalTasks, setPersonalTasks] = useState<PersonalTask[]>([]);
    const [userFiles, setUserFiles] = useState<UserFile[]>([]);
    const [completedTasks, setCompletedTasks] = useState<string[]>([]);
    const [unlockedTasks, setUnlockedTasks] = useState<string[]>([]);

    const loadAppData = useCallback(async (userId: string, userLand: string, userCity?: string) => {
        // Load completed/unlocked tasks from profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('completed_tasks, unlocked_tasks')
            .eq('id', userId)
            .maybeSingle();

        if (profile) {
            setCompletedTasks(profile.completed_tasks || []);
            setUnlockedTasks(profile.unlocked_tasks || []);
        }

        // Load news
        const { data: newsData } = await supabase
            .from('news')
            .select('*')
            .order('created_at', { ascending: false });

        if (newsData && newsData.length > 0) {
            // V2: Geo-Scoped 3-layer filter (DE + user's Land + user's City)
            const now = new Date();
            const filtered = newsData.filter((n: News) => {
                // Expiry check: skip if expires_at is set and past
                if (n.expires_at && new Date(n.expires_at) < now) return false;

                // Always show DE-level (national) news
                if (n.scope === 'DE') return true;

                // Show LAND-level news matching user's federal state
                if (n.scope === 'LAND' && n.land === userLand) return true;

                // Show CITY-level news matching user's city
                if (n.scope === 'CITY' && userCity && n.city === userCity) return true;

                // Legacy fallback: region matching
                if (!n.scope && (n.region === 'all' || n.region === userLand)) return true;

                return false;
            });

            // Sort by priority (HIGH > MEDIUM > LOW) then by date
            const priorityOrder: Record<string, number> = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 };
            filtered.sort((a, b) => {
                const aPriority = priorityOrder[a.priority || 'LOW'] ?? 2;
                const bPriority = priorityOrder[b.priority || 'LOW'] ?? 2;
                if (aPriority !== bPriority) return aPriority - bPriority;
                // Secondary sort by date (newest first)
                return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
            });

            setNews(filtered.length > 0 ? filtered : BACKUP_NEWS);
        }

        // Load tasks
        const { data: tasksData } = await supabase
            .from('tasks')
            .select('*')
            .order('id', { ascending: true });

        if (tasksData && tasksData.length > 0) {
            setTasks(tasksData);
        }

        // Load personal tasks
        const { data: personalData } = await supabase
            .from('personal_tasks')
            .select('*')
            .order('created_at', { ascending: true });

        if (personalData) {
            setPersonalTasks(personalData);
        }

        // Load user files
        const { data: filesData } = await supabase
            .from('user_files')
            .select('*')
            .order('created_at', { ascending: false });

        if (filesData) {
            setUserFiles(filesData);
        }
    }, []);

    const toggleTask = async (taskId: string, userId: string) => {
        const newTasks = completedTasks.includes(taskId)
            ? completedTasks.filter(id => id !== taskId)
            : [...completedTasks, taskId];

        setCompletedTasks(newTasks);
        await supabase
            .from('profiles')
            .update({ completed_tasks: newTasks })
            .eq('id', userId);
    };

    const unlockTask = async (
        task: Task,
        userId: string,
        currentCredits: number
    ): Promise<{ newCredits: number } | null> => {
        if (currentCredits < task.price) {
            return null;
        }

        const newCredits = currentCredits - task.price;
        const newUnlocked = [...unlockedTasks, task.id];

        setUnlockedTasks(newUnlocked);

        await supabase
            .from('profiles')
            .update({ credits: newCredits, unlocked_tasks: newUnlocked })
            .eq('id', userId);

        return { newCredits };
    };

    const addPersonalTask = async (userId: string, title: string) => {
        const { data, error } = await supabase
            .from('personal_tasks')
            .insert({ user_id: userId, title })
            .select()
            .single();

        if (data && !error) {
            setPersonalTasks([...personalTasks, data]);
        }
    };

    const togglePersonalTask = async (task: PersonalTask) => {
        const { error } = await supabase
            .from('personal_tasks')
            .update({ is_completed: !task.is_completed })
            .eq('id', task.id);

        if (!error) {
            setPersonalTasks(personalTasks.map(t =>
                t.id === task.id ? { ...t, is_completed: !t.is_completed } : t
            ));
        }
    };

    const deletePersonalTask = async (id: number) => {
        const { error } = await supabase
            .from('personal_tasks')
            .delete()
            .eq('id', id);

        if (!error) {
            setPersonalTasks(personalTasks.filter(t => t.id !== id));
        }
    };

    const addUserFile = (file: UserFile) => {
        setUserFiles([file, ...userFiles]);
    };

    const deleteUserFile = async (fileId: number) => {
        const { error } = await supabase
            .from('user_files')
            .delete()
            .eq('id', fileId);

        if (!error) {
            setUserFiles(userFiles.filter(f => f.id !== fileId));
        }
    };

    return {
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
        setCompletedTasks,
        setUnlockedTasks
    };
};
