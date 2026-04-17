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
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB44J4GL9CztaIWryeiEgfWarpHQijvy7Q",
    authDomain: "pypath-f0c3d.firebaseapp.com",
    projectId: "pypath-f0c3d",
    storageBucket: "pypath-f0c3d.firebasestorage.app",
    messagingSenderId: "955083209380",
    appId: "1:955083209380:web:ad7e86575ec7d279818431"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail,
    onAuthStateChanged,
    signOut,
    doc,
    setDoc,
    getDoc,
    updateDoc
};

export const getInitialUserData = () => ({
    totalScore: 0,
    completedLessons: [],
    goldenCrowns: [],
    modulesUnlocked: 1,
    energy: 5,
    lives: 5,
    lastEnergyUpdate: Date.now(),
    lastLifeUpdate: Date.now(),
    streak: 0,
    maxStreak: 0,
    lastLessonDate: null,
    streakHistory: {},
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
        perfectLessons: 0
    }
});