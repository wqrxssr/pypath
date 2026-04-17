import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    addDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ============ ТВОИ КЛЮЧИ ИЗ FIREBASE ============
const firebaseConfig = {
    apiKey: "AIzaSyB44J4GL9CztaIWryeiEgfWarpHQijvy7Q",
    authDomain: "pypath-f0c3d.firebaseapp.com",
    projectId: "pypath-f0c3d",
    storageBucket: "pypath-f0c3d.firebasestorage.app",
    messagingSenderId: "955083209380",
    appId: "1:955083209380:web:ad7e86575ec7d279818431"
};
// ================================================

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Экспорт функций аутентификации
export { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail,
    onAuthStateChanged,
    signOut
};

// Экспорт функций Firestore
export { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    addDoc,
    deleteDoc
};

// ============ НАЧАЛЬНЫЕ ДАННЫЕ ПОЛЬЗОВАТЕЛЯ ============
export const getInitialUserData = () => ({
    totalScore: 0,
    bestScore: 0,
    completedLessons: [],
    goldenCrowns: [],
    currentModule: "A1",
    modulesUnlocked: 1,
    energy: 5,
    lives: 5,
    lastEnergyUpdate: Date.now(),
    lastLifeUpdate: Date.now(),
    streak: 0,
    maxStreak: 0,
    lastLessonDate: null,
    streakHistory: {},
    rankPoints: 0,
    rank: "Бронзовый код",
    league: {
        name: "Бронзовая лига",
        position: 0,
        weeklyScore: 0
    },
    settings: {
        darkMode: true,
        soundsEnabled: true
    },
    dailyQuests: {
        date: new Date().toDateString(),
        quests: [
            { id: 1, text: "Пройти 2 урока", target: 2, progress: 0, completed: false, reward: 30, type: "points" },
            { id: 2, text: "3 правильных 'Объясни' подряд", target: 3, progress: 0, completed: false, reward: 1, type: "energy" },
            { id: 3, text: "Закончить тест", target: 1, progress: 0, completed: false, reward: 50, type: "points" }
        ]
    },
    stats: {
        totalLessonsCompleted: 0,
        totalEnergyUsed: 0,
        totalLivesLost: 0,
        totalCorrectExplains: 0,
        totalWrongExplains: 0,
        perfectLessons: 0
    }
});