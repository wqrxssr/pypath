import { 
    auth, db, 
    signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail,
    onAuthStateChanged, signOut,
    doc, setDoc, getDoc, updateDoc,
    collection, query, where, getDocs, orderBy, limit,
    addDoc, deleteDoc,
    getInitialUserData
} from './firebase-config.js';

// ============ ДАННЫЕ УРОКОВ (99 уроков) ============
// Модуль A1: Основы Python (уроки 1-14)
const lessonsData = {
    A1: [
        { id: "A1_1", title: "Переменные", type: "puzzle", 
          article: "Переменная — это 'коробка' с именем, где можно хранить данные. В Python переменная создается присваиванием: `x = 5`. Имя переменной должно начинаться с буквы или подчеркивания, может содержать буквы, цифры и подчеркивания.",
          task: { code: ["x = 5", "y = 10", "z = x + y", "print(z)"], expected: "15" },
          explain: { question: "Почему переменную нужно объявить до использования?", options: ["Python читает код сверху вниз", "Так красивее", "Иначе будет ошибка"], correct: 0 } },
        { id: "A1_2", title: "Типы данных", type: "fill",
          article: "В Python есть основные типы: int (целые числа), float (дробные), str (строки), bool (True/False). Функция type() показывает тип переменной.",
          task: { code: "x = ___\nprint(type(x))", correct: "5", hint: "Целое число" } },
        { id: "A1_3", title: "Функция print()", type: "code",
          article: "print() выводит текст на экран. Можно выводить несколько значений через запятую: print('Привет', 'мир'). f-строки: print(f'Значение: {x}')",
          task: { description: "Напиши код, который выводит 'Привет, мир!'", validator: (code) => code.includes('print') && code.includes("'Привет, мир!'") } },
        { id: "A1_4", title: "Ввод данных input()", type: "checkbox",
          article: "input() читает строку с клавиатуры. Всегда возвращает str. Для чисел нужно преобразование: int(input())",
          task: { question: "Что вернет input()?", options: ["Строку", "Число", "Список"], correct: [0] } },
        { id: "A1_5", title: "Приведение типов", type: "puzzle",
          article: "int() — в целое число, str() — в строку, float() — в дробное. Нужно преобразовывать типы перед операциями.",
          task: { code: ["x = '5'", "y = int(x)", "print(y + 3)"], expected: "8" } },
        { id: "A1_6", title: "Арифметика", type: "code",
          article: "+, -, *, / — деление всегда float, // — целочисленное деление, % — остаток, ** — степень.",
          task: { description: "Напиши код, который вычисляет 5 в 3 степени", validator: (code) => code.includes('5**3') || code.includes('pow(5,3)') } },
        { id: "A1_7", title: "Строки", type: "fill",
          article: "Строки можно складывать (+), умножать на число (*), брать срезы [начало:конец].",
          task: { code: "name = 'Анна'\nprint(name[___]) # выведет 'н'", correct: "1" } },
        { id: "A1_8", title: "f-строки", type: "code",
          article: "f-строки позволяют вставлять переменные: f'Привет, {name}'.",
          task: { description: "Создай переменную name='Анна' и выведи f'Привет, {name}'", validator: (code) => code.includes('f"') || code.includes("f'") } },
        { id: "A1_9", title: "Булевы значения", type: "explain",
          article: "bool: True и False. Результат сравнений: 5 > 3 → True, 2 == 3 → False.",
          task: { question: "Что вернет 5 == 5?", options: ["True", "False", "Ошибку"], correct: 0 } },
        { id: "A1_10", title: "Условия if", type: "puzzle",
          article: "if проверяет условие: if условие: → выполняет блок кода.",
          task: { code: ["x = 10", "if x > 5:", "print('Больше')"], expected: "Больше" } },
        { id: "A1_11", title: "Практика 1", type: "checkbox",
          article: "Проверь свои знания основ.",
          task: { question: "Какие типы данных есть в Python?", options: ["int", "str", "float", "char"], correct: [0,1,2] } },
        { id: "A1_12", title: "Практика 2", type: "code",
          article: "Напиши программу, которая запрашивает имя и выводит 'Привет, [имя]!'",
          task: { description: "Используй input() и print()", validator: (code) => code.includes('input') && code.includes('print') } },
        { id: "A1_13", title: "Практика 3", type: "fill",
          article: "Вычисли площадь прямоугольника со сторонами 5 и 3.",
          task: { code: "a = 5\nb = 3\ns = ___\nprint(s)", correct: "15" } },
        { id: "A1_14", title: "Повторение A1", type: "checkbox",
          article: "Повторим все темы модуля A1: переменные, типы, ввод/вывод.",
          task: { question: "Что делает int(input())?", options: ["Читает число", "Читает строку", "Выводит число"], correct: [0] } }
    ],
    // A2, B1, B2, C1, C2, C3 будут добавлены аналогично
    // Для экономии места в сообщении, добавлю остальные модули в следующем сообщении
};

// ============ ЗВУКИ ============
let soundEnabled = true;

function playSound(soundName) {
    if (!soundEnabled) return;
    const audio = new Audio(`sounds/${soundName}.mp3`);
    audio.play().catch(() => {}); // тихо падаем если нет файла
}

// ============ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ============
function showMessage(text, type = 'info') {
    const msgDiv = document.getElementById('messageArea');
    if (msgDiv) {
        msgDiv.textContent = text;
        msgDiv.className = `message-area ${type}`;
        setTimeout(() => {
            msgDiv.textContent = '';
            msgDiv.className = 'message-area';
        }, 3000);
    } else {
        alert(text);
    }
}

async function updateUserData(updates) {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, updates);
    Object.assign(userData, updates);
}

// Обновление энергии и жизней по времени
function updateResources() {
    if (!userData) return;
    const now = Date.now();
    
    // Энергия: 1 в час
    const energyPassed = Math.floor((now - userData.lastEnergyUpdate) / 3600000);
    if (energyPassed > 0) {
        userData.energy = Math.min(5, userData.energy + energyPassed);
        userData.lastEnergyUpdate = now;
    }
    
    // Жизни: 1 в 30 минут
    const lifePassed = Math.floor((now - userData.lastLifeUpdate) / 1800000);
    if (lifePassed > 0) {
        userData.lives = Math.min(5, userData.lives + lifePassed);
        userData.lastLifeUpdate = now;
    }
    
    updateUI();
}

let currentUser = null;
let userData = null;

// ============ АУТЕНТИФИКАЦИЯ ============
if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabs = document.querySelectorAll('.auth-tab');
    const forgotLink = document.getElementById('forgotPassword');
    
    if (tabs) {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const tabName = tab.dataset.tab;
                document.getElementById('loginForm').classList.toggle('active', tabName === 'login');
                document.getElementById('registerForm').classList.toggle('active', tabName === 'register');
            });
        });
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            try {
                await signInWithEmailAndPassword(auth, email, password);
                window.location.href = 'dashboard.html';
            } catch (error) {
                document.getElementById('authMessage').textContent = 'Ошибка: ' + error.message;
            }
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const confirm = document.getElementById('regConfirm').value;
            if (password !== confirm) {
                document.getElementById('authMessage').textContent = 'Пароли не совпадают';
                return;
            }
            try {
                const userCred = await createUserWithEmailAndPassword(auth, email, password);
                const initialData = getInitialUserData();
                await setDoc(doc(db, 'users', userCred.user.uid), initialData);
                window.location.href = 'dashboard.html';
            } catch (error) {
                document.getElementById('authMessage').textContent = 'Ошибка: ' + error.message;
            }
        });
    }
    
    if (forgotLink) {
        forgotLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = prompt('Введите ваш email для восстановления пароля:');
            if (email) {
                try {
                    await sendPasswordResetEmail(auth, email);
                    alert('Ссылка для сброса пароля отправлена на ваш email');
                } catch (error) {
                    alert('Ошибка: ' + error.message);
                }
            }
        });
    }
}

// ============ DASHBOARD ============
if (window.location.pathname.includes('dashboard.html')) {
    onAuthStateChanged(auth, async (user) => {
        if (!user) { window.location.href = 'index.html'; return; }
        currentUser = user;
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            userData = userSnap.data();
        } else {
            userData = getInitialUserData();
            await setDoc(userRef, userData);
        }
        
        updateResources();
        setInterval(updateResources, 60000);
        
        // Обновление ежедневных заданий
        const today = new Date().toDateString();
        if (userData.dailyQuests?.date !== today) {
            userData.dailyQuests = {
                date: today,
                quests: [
                    { id: 1, text: "Пройти 2 урока", target: 2, progress: 0, completed: false, reward: 30, type: "points" },
                    { id: 2, text: "3 правильных 'Объясни' подряд", target: 3, progress: 0, completed: false, reward: 1, type: "energy" },
                    { id: 3, text: "Закончить тест", target: 1, progress: 0, completed: false, reward: 50, type: "points" }
                ]
            };
            await saveUserData();
        }
        
        // Ежедневный бонус за стрейк
        const lastDate = userData.lastLessonDate;
        const nowDate = new Date().toDateString();
        if (lastDate !== nowDate) {
            // проверка стрейка
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastDate === yesterday.toDateString()) {
                userData.streak = (userData.streak || 0) + 1;
                userData.maxStreak = Math.max(userData.maxStreak, userData.streak);
                userData.totalScore += 10; // бонус за день стрейка
                showMessage(`🔥 Стрейк: ${userData.streak} дней! +10 очков`, 'success');
            } else if (lastDate !== nowDate) {
                // стрейк не обновляем, но и не сбрасываем пока
            }
        }
        
        updateUI();
        loadModules();
        loadDailyQuests();
        loadReviewLessons();
        
        // Тема
        if (userData.settings?.darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            document.getElementById('themeToggle').innerHTML = '<i class="fas fa-moon"></i>';
        }
        soundEnabled = userData.settings?.soundsEnabled !== false;
        document.getElementById('soundToggle').innerHTML = soundEnabled ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
        
        // Кнопки
        document.getElementById('themeToggle').addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
            document.getElementById('themeToggle').innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
            userData.settings = userData.settings || {};
            userData.settings.darkMode = !isDark;
            saveUserData();
        });
        
        document.getElementById('soundToggle').addEventListener('click', () => {
            soundEnabled = !soundEnabled;
            userData.settings = userData.settings || {};
            userData.settings.soundsEnabled = soundEnabled;
            document.getElementById('soundToggle').innerHTML = soundEnabled ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
            saveUserData();
        });
        
        document.getElementById('logoutBtn').addEventListener('click', async () => {
            await signOut(auth);
            window.location.href = 'index.html';
        });
        
        document.getElementById('profileBtn').addEventListener('click', () => {
            window.location.href = 'profile.html';
        });
        
        document.getElementById('buyEnergyBtn').addEventListener('click', async () => {
            if (userData.totalScore >= 50 && userData.energy < 5) {
                userData.totalScore -= 50;
                userData.energy = Math.min(5, userData.energy + 1);
                await saveUserData();
                updateUI();
                showMessage('⚡ +1 энергия!', 'success');
                playSound('reward');
            } else {
                showMessage('Недостаточно очков или энергия полна', 'error');
            }
        });
        
        document.getElementById('buyLifeBtn').addEventListener('click', async () => {
            if (userData.totalScore >= 100 && userData.lives < 5) {
                userData.totalScore -= 100;
                userData.lives = Math.min(5, userData.lives + 1);
                await saveUserData();
                updateUI();
                showMessage('❤️ +1 жизнь!', 'success');
                playSound('reward');
            } else {
                showMessage('Недостаточно очков или жизни полны', 'error');
            }
        });
        
        // Стрейк модалка
        document.getElementById('streakBtn').addEventListener('click', () => {
            document.getElementById('streakModalValue').textContent = `${userData.streak || 0} дней`;
            renderCalendar();
            document.getElementById('streakModal').classList.add('active');
        });
        
        document.getElementById('closeModalBtn').addEventListener('click', () => {
            document.getElementById('streakModal').classList.remove('active');
        });
        
        document.getElementById('restoreStreakBtn').addEventListener('click', async () => {
            if (userData.totalScore >= 200) {
                userData.totalScore -= 200;
                userData.streak = (userData.streak || 0) + 1;
                await saveUserData();
                updateUI();
                document.getElementById('streakModalValue').textContent = `${userData.streak} дней`;
                renderCalendar();
                showMessage('🔥 Стрейк восстановлен!', 'success');
                playSound('levelup');
            } else {
                showMessage('Недостаточно очков (нужно 200)', 'error');
            }
        });
        
        function renderCalendar() {
            const calendar = document.getElementById('calendarContainer');
            calendar.innerHTML = '';
            const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
            days.forEach(day => {
                const dayDiv = document.createElement('div');
                dayDiv.className = 'calendar-day';
                dayDiv.textContent = day;
                calendar.appendChild(dayDiv);
            });
            // TODO: добавить реальную историю стрейка из userData.streakHistory
        }
    });
}
function updateUI() {
    const energyEl = document.getElementById('energyValue');
    const livesEl = document.getElementById('livesValue');
    const scoreEl = document.getElementById('scoreValue');
    const streakEl = document.getElementById('streakValue');
    const rankNameEl = document.getElementById('rankName');
    const rankPointsEl = document.getElementById('rankPoints');
    const rankProgressEl = document.getElementById('rankProgress');
    const nextRankEl = document.getElementById('nextRank');
    const leagueNameEl = document.getElementById('leagueName');
    const leaguePositionEl = document.getElementById('leaguePosition');
    const energyValue2 = document.getElementById('energyValue2');
    const livesValue2 = document.getElementById('livesValue2');
    
    if (energyEl) energyEl.textContent = userData.energy;
    if (livesEl) livesEl.textContent = userData.lives;
    if (scoreEl) scoreEl.textContent = userData.totalScore;
    if (streakEl) streakEl.textContent = userData.streak || 0;
    if (energyValue2) energyValue2.textContent = userData.energy;
    if (livesValue2) livesValue2.textContent = userData.lives;
    
    // Ранги
    const ranks = [
        { name: "Бронзовый код", min: 0, next: 500 },
        { name: "Серебряный код", min: 500, next: 1500 },
        { name: "Золотой код", min: 1500, next: 3000 },
        { name: "Платиновый код", min: 3000, next: 5000 },
        { name: "Алмазный код", min: 5000, next: 8000 },
        { name: "Мастер Python", min: 8000, next: null }
    ];
    
    let currentRank = ranks[0];
    let nextRank = ranks[1];
    for (let i = 0; i < ranks.length; i++) {
        if (userData.totalScore >= ranks[i].min) {
            currentRank = ranks[i];
            nextRank = ranks[i + 1] || null;
        }
    }
    
    if (rankNameEl) rankNameEl.textContent = currentRank.name;
    if (rankPointsEl && nextRank) {
        const pointsInRank = userData.totalScore - currentRank.min;
        const rankRange = nextRank.min - currentRank.min;
        const percent = (pointsInRank / rankRange) * 100;
        rankPointsEl.textContent = `${userData.totalScore} / ${nextRank.min}`;
        if (rankProgressEl) rankProgressEl.style.width = `${percent}%`;
        if (nextRankEl) nextRankEl.textContent = `→ ${nextRank.min}`;
    } else if (rankPointsEl) {
        rankPointsEl.textContent = `${userData.totalScore} (МАКСИМУМ)`;
        if (rankProgressEl) rankProgressEl.style.width = '100%';
        if (nextRankEl) nextRankEl.textContent = `→ МАСТЕР`;
    }
    
    if (leagueNameEl) leagueNameEl.textContent = userData.league?.name || "Бронзовая лига";
    if (leaguePositionEl) leaguePositionEl.textContent = userData.league?.position || 0;
    
    // Таймер следующей энергии
    if (userData.energy < 5) {
        const lastUpdate = userData.lastEnergyUpdate;
        const nextEnergyTime = lastUpdate + 3600000;
        const now = Date.now();
        const diff = nextEnergyTime - now;
        if (diff > 0) {
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            const nextEnergyEl = document.getElementById('nextEnergy');
            if (nextEnergyEl) nextEnergyEl.textContent = `Следующая: ${hours}ч ${minutes}м ${seconds}с`;
        }
    } else {
        const nextEnergyEl = document.getElementById('nextEnergy');
        if (nextEnergyEl) nextEnergyEl.textContent = `Энергия полна!`;
    }
}

async function saveUserData() {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    await setDoc(userRef, userData, { merge: true });
}

function loadDailyQuests() {
    const container = document.getElementById('questsList');
    if (!container || !userData?.dailyQuests) return;
    
    container.innerHTML = '';
    userData.dailyQuests.quests.forEach(quest => {
        const div = document.createElement('div');
        div.className = `quest-item ${quest.completed ? 'completed' : ''}`;
        const rewardText = quest.type === 'points' ? `+${quest.reward}⭐` : `+${quest.reward}⚡`;
        div.innerHTML = `
            <span>${quest.completed ? '✅' : '◻️'}</span>
            <span>${quest.text}</span>
            <span>${quest.progress}/${quest.target}</span>
            <span>${rewardText}</span>
        `;
        container.appendChild(div);
    });
}

function loadModules() {
    const container = document.getElementById('modulesGrid');
    if (!container) return;
    
    const modules = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'C3'];
    const moduleNames = {
        A1: '🌱 Начинающий', A2: '📖 Базовый', B1: '⚡ Средний',
        B2: '🚀 Выше среднего', C1: '💎 Продвинутый', C2: '🔥 Эксперт', C3: '👑 Мастер Python'
    };
    const moduleIcons = {
        A1: '🌱', A2: '📖', B1: '⚡', B2: '🚀', C1: '💎', C2: '🔥', C3: '👑'
    };
    
    container.innerHTML = '';
    
    for (let i = 0; i < modules.length; i++) {
        const moduleId = modules[i];
        const isUnlocked = i < userData.modulesUnlocked;
        const lessons = lessonsData[moduleId] || [];
        const completedCount = lessons.filter(l => userData.completedLessons?.includes(l.id)).length;
        const percent = (completedCount / lessons.length) * 100;
        
        const card = document.createElement('div');
        card.className = `module-card ${!isUnlocked ? 'locked' : ''}`;
        card.innerHTML = `
            <div class="module-icon">${moduleIcons[moduleId]}</div>
            <h3>Модуль ${moduleId}</h3>
            <p>${moduleNames[moduleId]}</p>
            <div class="progress-bar"><div class="progress-fill" style="width: ${percent}%"></div></div>
            <p style="font-size: 0.8rem; color: var(--text-secondary);">${completedCount}/${lessons.length} уроков</p>
        `;
        
        if (isUnlocked) {
            card.addEventListener('click', () => {
                localStorage.setItem('currentModule', moduleId);
                window.location.href = `module.html?module=${moduleId}`;
            });
        }
        
        container.appendChild(card);
    }
}

function loadReviewLessons() {
    const container = document.getElementById('reviewLessons');
    if (!container || !userData) return;
    const completed = userData.completedLessons || [];
    if (completed.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">Пока нет пройденных уроков</p>';
        return;
    }
    
    container.innerHTML = '';
    const recentCompleted = completed.slice(-6);
    for (const lessonId of recentCompleted) {
        for (const module in lessonsData) {
            const lesson = lessonsData[module].find(l => l.id === lessonId);
            if (lesson) {
                const btn = document.createElement('button');
                btn.innerHTML = `<i class="fas fa-undo-alt"></i> ${lesson.title}`;
                btn.addEventListener('click', () => {
                    localStorage.setItem('reviewLesson', JSON.stringify(lesson));
                    localStorage.setItem('reviewMode', 'true');
                    window.location.href = 'lesson.html';
                });
                container.appendChild(btn);
                break;
            }
        }
    }
}

// ============ MODULE PAGE ============
if (window.location.pathname.includes('module.html')) {
    onAuthStateChanged(auth, async (user) => {
        if (!user) { window.location.href = 'index.html'; return; }
        currentUser = user;
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        userData = userSnap.data();
        
        const urlParams = new URLSearchParams(window.location.search);
        const moduleId = urlParams.get('module') || localStorage.getItem('currentModule') || 'A1';
        
        const moduleNames = { A1: 'Начинающий', A2: 'Базовый', B1: 'Средний', B2: 'Выше среднего', C1: 'Продвинутый', C2: 'Эксперт', C3: 'Мастер Python' };
        const moduleIcons = { A1: '🌱', A2: '📖', B1: '⚡', B2: '🚀', C1: '💎', C2: '🔥', C3: '👑' };
        
        document.getElementById('moduleTitle').textContent = `Модуль ${moduleId}`;
        document.getElementById('moduleDesc').textContent = moduleNames[moduleId];
        document.getElementById('moduleIcon').textContent = moduleIcons[moduleId];
        
        updateUI();
        
        const lessons = lessonsData[moduleId] || [];
        const completedCount = lessons.filter(l => userData.completedLessons?.includes(l.id)).length;
        const percent = (completedCount / lessons.length) * 100;
        document.getElementById('moduleProgress').style.width = `${percent}%`;
        document.getElementById('progressText').textContent = `${completedCount}/${lessons.length} уроков`;
        
        const container = document.getElementById('lessonsList');
        container.innerHTML = '';
        
        for (let i = 0; i < lessons.length; i++) {
            const lesson = lessons[i];
            const isCompleted = userData.completedLessons?.includes(lesson.id);
            const hasGoldenCrown = userData.goldenCrowns?.includes(lesson.id);
            
            const typeIcons = { puzzle: '🧩', fill: '✏️', explain: '💡', checkbox: '✅', code: '💻' };
            const typeIcon = typeIcons[lesson.type] || '📘';
            
            const div = document.createElement('div');
            div.className = `glass-card lesson-item`; // будет отдельный стиль
            div.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; margin-bottom: 12px; cursor: pointer;';
            div.innerHTML = `
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="font-size: 1.5rem;">${hasGoldenCrown ? '👑' : typeIcon}</div>
                    <div>
                        <h3 style="margin: 0;">${lesson.title}</h3>
                        <p style="margin: 4px 0 0; font-size: 0.8rem; color: var(--text-secondary);">${isCompleted ? '✅ Пройден' : '📖 Не пройден'}</p>
                    </div>
                </div>
                <div>
                    <i class="fas fa-chevron-right"></i>
                </div>
            `;
            
            div.addEventListener('click', () => {
                if (userData.energy < 1 && !isCompleted) {
                    showMessage('❌ Недостаточно энергии! Подождите восстановления.', 'error');
                    return;
                }
                localStorage.setItem('currentLesson', JSON.stringify(lesson));
                localStorage.setItem('currentModuleId', moduleId);
                window.location.href = 'lesson.html';
            });
            
            container.appendChild(div);
        }
        
        document.getElementById('startTestBtn')?.addEventListener('click', () => {
            localStorage.setItem('testModule', moduleId);
            window.location.href = 'test.html';
        });
        
        document.getElementById('backBtn')?.addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });
    });
}

// ============ LESSON PAGE (часть 1) ============
if (window.location.pathname.includes('lesson.html')) {
    let currentLesson = null;
    let articleRead = false;
    let hintUsed = false;
    let correctStreak = 0;
    
    onAuthStateChanged(auth, async (user) => {
        if (!user) { window.location.href = 'index.html'; return; }
        currentUser = user;
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        userData = userSnap.data();
        
        updateUI();
        
        const savedLesson = localStorage.getItem('currentLesson');
        if (!savedLesson) { window.location.href = 'dashboard.html'; return; }
        currentLesson = JSON.parse(savedLesson);
        const isReviewMode = localStorage.getItem('reviewMode') === 'true';
        
        document.getElementById('articleTitle').textContent = currentLesson.title;
        document.getElementById('articleContent').innerHTML = `
            <div style="background: var(--card-bg); padding: 20px; border-radius: 20px; margin: 16px 0;">
                ${currentLesson.article}
            </div>
            <div style="background: var(--accent-light); padding: 16px; border-radius: 16px; border-left: 4px solid var(--accent);">
                <strong><i class="fas fa-lightbulb"></i> Ключевая идея:</strong><br>
                ${currentLesson.article.split('.').slice(0, 2).join('.')}.
            </div>
        `;
        
        document.getElementById('taskTitle').textContent = currentLesson.title;
        
        // Если режим повторения — пропускаем статью и трату энергии
        if (isReviewMode) {
            articleRead = true;
            document.getElementById('articleBlock').style.display = 'none';
            document.getElementById('taskBlock').style.display = 'block';
            setupTask();
            localStorage.removeItem('reviewMode');
        } else {
            // Тратим энергию только если урок не пройден
            if (!userData.completedLessons?.includes(currentLesson.id)) {
                if (userData.energy < 1) {
                    showMessage('❌ Недостаточно энергии!', 'error');
                    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
                    return;
                }
                userData.energy -= 1;
                userData.stats.totalEnergyUsed = (userData.stats.totalEnergyUsed || 0) + 1;
                saveUserData();
                updateUI();
            }
        }
        
        document.getElementById('startLessonBtn').addEventListener('click', () => {
            articleRead = true;
            document.getElementById('articleBlock').style.display = 'none';
            document.getElementById('taskBlock').style.display = 'block';
            setupTask();
        });
        
        document.getElementById('closeArticleBtn').addEventListener('click', () => {
            articleRead = true;
            document.getElementById('articleBlock').style.display = 'none';
            document.getElementById('taskBlock').style.display = 'block';
            setupTask();
        });
        
        document.getElementById('exitBtn').addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });
        
        function setupTask() {
            const type = currentLesson.type;
            document.getElementById('puzzleTask').style.display = 'none';
            document.getElementById('fillTask').style.display = 'none';
            document.getElementById('explainTask').style.display = 'none';
            document.getElementById('checkboxTask').style.display = 'none';
            document.getElementById('codeTask').style.display = 'none';
            
            if (type === 'puzzle') {
                document.getElementById('puzzleTask').style.display = 'block';
                setupPuzzle();
            } else if (type === 'fill') {
                document.getElementById('fillTask').style.display = 'block';
                document.getElementById('fillCode').innerHTML = `<pre>${currentLesson.task.code}</pre>`;
            } else if (type === 'explain') {
                document.getElementById('explainTask').style.display = 'block';
                document.getElementById('explainQuestion').textContent = currentLesson.task.question;
                const optionsDiv = document.getElementById('explainOptions');
                optionsDiv.innerHTML = '';
                currentLesson.task.options.forEach((opt, idx) => {
                    const label = document.createElement('label');
                    label.style.cssText = 'display: block; margin: 8px 0;';
                    label.innerHTML = `<input type="radio" name="explain" value="${idx}"> ${opt}`;
                    optionsDiv.appendChild(label);
                });
            } else if (type === 'checkbox') {
                document.getElementById('checkboxTask').style.display = 'block';
                document.getElementById('checkboxQuestion').textContent = currentLesson.task.question;
                const optionsDiv = document.getElementById('checkboxOptions');
                optionsDiv.innerHTML = '';
                currentLesson.task.options.forEach((opt, idx) => {
                    const label = document.createElement('label');
                    label.style.cssText = 'display: block; margin: 8px 0;';
                    label.innerHTML = `<input type="checkbox" name="checkbox" value="${idx}"> ${opt}`;
                    optionsDiv.appendChild(label);
                });
            } else if (type === 'code') {
                document.getElementById('codeTask').style.display = 'block';
                document.getElementById('codeTaskDesc').textContent = currentLesson.task.description;
            }
            
            // Золотая корона
            if (userData.goldenCrowns?.includes(currentLesson.id)) {
                document.getElementById('goldenCrownBadge').style.display = 'block';
            }
        }
        
        function setupPuzzle() {
            const pieces = [...currentLesson.task.code];
            for (let i = pieces.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
            }
            
            const container = document.getElementById('puzzleContainer');
            container.innerHTML = '';
            pieces.forEach((piece, idx) => {
                const div = document.createElement('div');
                div.className = 'puzzle-piece';
                div.textContent = piece;
                div.draggable = true;
                div.dataset.index = idx;
                div.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', idx);
                });
                div.addEventListener('dragover', (e) => e.preventDefault());
                div.addEventListener('drop', (e) => {
                    e.preventDefault();
                    const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
                    const toIdx = idx;
                    if (fromIdx !== toIdx) {
                        [pieces[fromIdx], pieces[toIdx]] = [pieces[toIdx], pieces[fromIdx]];
                        setupPuzzle();
                    }
                });
                container.appendChild(div);
            });
            
            window.checkPuzzle = () => {
                const isCorrect = pieces.join('') === currentLesson.task.code.join('');
                if (isCorrect) {
                    completeLesson(true);
                } else {
                    handleWrong();
                }
            };
        }
        
        document.getElementById('checkTaskBtn').addEventListener('click', () => {
            const type = currentLesson.type;
            if (type === 'puzzle') {
                if (window.checkPuzzle) window.checkPuzzle();
            } else if (type === 'fill') {
                const answer = document.getElementById('fillAnswer').value.trim();
                const isCorrect = answer === currentLesson.task.correct;
                if (isCorrect) completeLesson(true);
                else handleWrong();
            } else if (type === 'explain') {
                const selected = document.querySelector('input[name="explain"]:checked');
                if (!selected) { showMessage('Выбери ответ', 'error'); return; }
                const isCorrect = parseInt(selected.value) === currentLesson.task.correct;
                if (isCorrect) completeLesson(true);
                else handleWrong();
            } else if (type === 'checkbox') {
                const selected = Array.from(document.querySelectorAll('input[name="checkbox"]:checked')).map(cb => parseInt(cb.value));
                const isCorrect = JSON.stringify(selected.sort()) === JSON.stringify(currentLesson.task.correct.sort());
                if (isCorrect) completeLesson(true);
                else handleWrong();
            } else if (type === 'code') {
                const code = document.getElementById('codeAnswer').value;
                const isCorrect = currentLesson.task.validator(code);
                if (isCorrect) completeLesson(true);
                else handleWrong();
            }
        });
        
        document.getElementById('hintBtn').addEventListener('click', async () => {
            if (hintUsed) { showMessage('Подсказка уже использована', 'info'); return; }
            if (userData.totalScore < 20) { showMessage('Недостаточно очков (нужно 20)', 'error'); return; }
            userData.totalScore -= 20;
            hintUsed = true;
            await saveUserData();
            updateUI();
            
            if (currentLesson.type === 'puzzle') {
                showMessage('💡 Первый элемент должен быть: ' + currentLesson.task.code[0], 'info');
            } else if (currentLesson.type === 'fill') {
                showMessage('💡 Подсказка: ' + (currentLesson.task.hint || 'Подумай о теме урока'), 'info');
            } else if (currentLesson.type === 'code') {
                showMessage('💡 Используй print() для вывода', 'info');
            } else {
                showMessage('💡 Внимательно перечитай статью', 'info');
            }
        });
        
        async function handleWrong() {
            playSound('wrong');
            userData.lives = Math.max(0, userData.lives - 1);
            userData.stats.totalLivesLost = (userData.stats.totalLivesLost || 0) + 1;
            correctStreak = 0;
            await saveUserData();
            updateUI();
            
            if (userData.lives <= 0) {
                showMessage('💀 Жизни кончились! Возврат на главную...', 'error');
                setTimeout(() => { window.location.href = 'dashboard.html'; }, 2000);
            } else {
                showMessage(`❌ Неправильно! Осталось ${userData.lives} жизней. Попробуй ещё раз.`, 'error');
            }
        }
        
        async function completeLesson(isPerfect) {
            playSound('correct');
            
            const isFirstTime = !userData.completedLessons?.includes(currentLesson.id);
            
            if (isFirstTime) {
                userData.completedLessons = userData.completedLessons || [];
                userData.completedLessons.push(currentLesson.id);
                userData.totalScore += 30;
                userData.stats.totalLessonsCompleted = (userData.stats.totalLessonsCompleted || 0) + 1;
                
                // Восстановление жизни за урок
                userData.lives = Math.min(5, userData.lives + 1);
                
                // Обновление ежедневных заданий
                if (userData.dailyQuests) {
                    const quest1 = userData.dailyQuests.quests.find(q => q.id === 1);
                    if (quest1 && !quest1.completed) {
                        quest1.progress++;
                        if (quest1.progress >= quest1.target) {
                            quest1.completed = true;
                            userData.totalScore += quest1.reward;
                            showMessage(`🎉 Задание выполнено: +${quest1.reward} очков!`, 'success');
                        }
                    }
                    
                    const quest2 = userData.dailyQuests.quests.find(q => q.id === 2);
                    if (quest2 && !quest2.completed) {
                        correctStreak++;
                        quest2.progress = correctStreak;
                        if (correctStreak >= quest2.target) {
                            quest2.completed = true;
                            userData.energy = Math.min(5, userData.energy + 1);
                            showMessage(`🎉 Задание выполнено: +1 энергия!`, 'success');
                        }
                    }
                }
                
                // Золотая корона
                if (!hintUsed && !userData.goldenCrowns?.includes(currentLesson.id)) {
                    userData.goldenCrowns = userData.goldenCrowns || [];
                    userData.goldenCrowns.push(currentLesson.id);
                    userData.stats.perfectLessons = (userData.stats.perfectLessons || 0) + 1;
                    showMessage('👑 ЗОЛОТАЯ КОРОНА! Идеальное прохождение!', 'success');
                    playSound('levelup');
                }
                
                // Обновление стрейка
                const today = new Date().toDateString();
                userData.lastLessonDate = today;
                userData.streak = (userData.streak || 0) + 1;
                userData.maxStreak = Math.max(userData.maxStreak, userData.streak);
                
                await saveUserData();
                updateUI();
            }
            
            const resultBlock = document.getElementById('resultBlock');
            resultBlock.style.display = 'block';
            resultBlock.innerHTML = `
                <i class="fas fa-check-circle" style="font-size: 3rem; color: var(--success);"></i>
                <h2>Поздравляю!</h2>
                <p>Урок "${currentLesson.title}" пройден!</p>
                ${isFirstTime ? '<p>+30 очков, +1 жизнь</p>' : '<p>Повторение пройдено</p>'}
                <button id="continueBtn" class="btn-primary" style="margin-top: 20px;">Продолжить</button>
            `;
            document.getElementById('continueBtn').addEventListener('click', () => {
                window.location.href = 'dashboard.html';
            });
        }
    });
}
// ============ TEST PAGE ============
if (window.location.pathname.includes('test.html')) {
    let testModule = null;
    let questions = [];
    let answers = [];
    let currentIndex = 0;
    
    // Тесты для всех модулей
    const testsData = {
        A1: [
            { question: "Что выведет print(5 + 3)?", options: ["5", "8", "53"], correct: 1 },
            { question: "Какой тип данных у 'Hello'?", options: ["int", "str", "float"], correct: 1 },
            { question: "Какая переменная названа правильно?", options: ["1var", "var_name", "var-name"], correct: 1 },
            { question: "Что делает input()?", options: ["Выводит текст", "Читает ввод", "Завершает программу"], correct: 1 },
            { question: "Как преобразовать строку '5' в число?", options: ["str('5')", "int('5')", "float('5')"], correct: 1 },
            { question: "Что вернет type(3.14)?", options: ["int", "float", "str"], correct: 1 },
            { question: "Как вывести 'Привет мир'?", options: ["print('Привет мир')", "output('Привет мир')", "console.log('Привет мир')"], correct: 0 },
            { question: "Что такое переменная?", options: ["Контейнер для данных", "Функция", "Цикл"], correct: 0 },
            { question: "Какое имя переменной корректно?", options: ["_myVar", "2myVar", "my-var"], correct: 0 },
            { question: "Что делает f-строка?", options: ["Форматирует строку", "Умножает строку", "Создает список"], correct: 0 },
            { question: "Какой результат 5 // 2?", options: ["2", "2.5", "3"], correct: 0 },
            { question: "Какой результат 5 % 2?", options: ["1", "2", "0"], correct: 0 },
            { question: "Что такое bool?", options: ["Булев тип", "Строка", "Число"], correct: 0 },
            { question: "Что вернет 5 > 3?", options: ["True", "False", "Ошибка"], correct: 0 },
            { question: "Какой оператор сравнения 'равно'?", options: ["=", "==", "!="], correct: 1 }
        ],
        // A2, B1, B2, C1, C2, C3 будут добавлены аналогично (в финальной версии добавлю все)
        A2: [{ question: "Пример теста A2", options: ["Да", "Нет"], correct: 0 }],
        B1: [{ question: "Пример теста B1", options: ["Да", "Нет"], correct: 0 }],
        B2: [{ question: "Пример теста B2", options: ["Да", "Нет"], correct: 0 }],
        C1: [{ question: "Пример теста C1", options: ["Да", "Нет"], correct: 0 }],
        C2: [{ question: "Пример теста C2", options: ["Да", "Нет"], correct: 0 }],
        C3: [{ question: "Пример теста C3", options: ["Да", "Нет"], correct: 0 }]
    };
    
    onAuthStateChanged(auth, async (user) => {
        if (!user) { window.location.href = 'index.html'; return; }
        currentUser = user;
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        userData = userSnap.data();
        
        testModule = localStorage.getItem('testModule') || 'A1';
        questions = testsData[testModule] || [];
        answers = new Array(questions.length).fill(null);
        
        document.getElementById('testTitle').textContent = `Тест модуля ${testModule}`;
        document.getElementById('totalQuestions').textContent = questions.length;
        
        loadQuestion(0);
        
        document.getElementById('prevBtn').addEventListener('click', () => {
            if (currentIndex > 0) {
                saveCurrentAnswer();
                currentIndex--;
                loadQuestion(currentIndex);
            }
        });
        
        document.getElementById('nextBtn').addEventListener('click', () => {
            saveCurrentAnswer();
            if (currentIndex < questions.length - 1) {
                currentIndex++;
                loadQuestion(currentIndex);
            } else {
                document.getElementById('nextBtn').style.display = 'none';
                document.getElementById('submitTestBtn').style.display = 'block';
            }
        });
        
        document.getElementById('submitTestBtn').addEventListener('click', submitTest);
        document.getElementById('exitBtn').addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });
        
        function saveCurrentAnswer() {
            const selected = document.querySelector('input[name="answer"]:checked');
            if (selected) {
                answers[currentIndex] = parseInt(selected.value);
            }
        }
        
        function loadQuestion(index) {
            const q = questions[index];
            const container = document.getElementById('questionContainer');
            container.innerHTML = `
                <h3>Вопрос ${index + 1} из ${questions.length}</h3>
                <p style="margin: 16px 0; font-size: 1.1rem;">${q.question}</p>
                <div class="options">
                    ${q.options.map((opt, i) => `
                        <label style="display: block; margin: 12px 0; padding: 12px; background: var(--card-bg); border-radius: 16px; cursor: pointer;">
                            <input type="radio" name="answer" value="${i}" ${answers[index] === i ? 'checked' : ''}>
                            <span style="margin-left: 12px;">${opt}</span>
                        </label>
                    `).join('')}
                </div>
            `;
            
            document.getElementById('prevBtn').disabled = index === 0;
            const answeredCount = answers.filter(a => a !== null).length;
            document.getElementById('correctCount').textContent = answeredCount;
            document.getElementById('testProgress').style.width = `${((index + 1) / questions.length) * 100}%`;
        }
        
        async function submitTest() {
            saveCurrentAnswer();
            let correct = 0;
            for (let i = 0; i < questions.length; i++) {
                if (answers[i] === questions[i].correct) correct++;
            }
            
            const percent = (correct / questions.length) * 100;
            const passed = percent >= 70;
            
            const resultDiv = document.getElementById('testResult');
            resultDiv.style.display = 'block';
            document.querySelector('.test-controls').style.display = 'none';
            document.getElementById('questionContainer').style.display = 'none';
            
            if (passed) {
                const reward = 50;
                userData.totalScore += reward;
                
                // Открываем следующий модуль
                const modules = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'C3'];
                const currentIdx = modules.indexOf(testModule);
                if (currentIdx + 1 > (userData.modulesUnlocked || 1)) {
                    userData.modulesUnlocked = currentIdx + 2;
                }
                
                // Обновляем ежедневное задание
                if (userData.dailyQuests) {
                    const quest3 = userData.dailyQuests.quests.find(q => q.id === 3);
                    if (quest3 && !quest3.completed) {
                        quest3.completed = true;
                        userData.totalScore += quest3.reward;
                    }
                }
                
                await saveUserData();
                playSound('levelup');
                
                resultDiv.innerHTML = `
                    <i class="fas fa-trophy" style="font-size: 3rem; color: var(--warning);"></i>
                    <h2>Поздравляем!</h2>
                    <p>Вы набрали ${correct}/${questions.length} (${percent}%)</p>
                    <p>Модуль ${testModule} пройден! +${reward} очков</p>
                    <p>✨ Открыт следующий модуль! ✨</p>
                    <button id="continueBtn" class="btn-primary" style="margin-top: 20px;">Продолжить</button>
                `;
            } else {
                playSound('wrong');
                resultDiv.innerHTML = `
                    <i class="fas fa-sad-tear" style="font-size: 3rem; color: var(--danger);"></i>
                    <h2>Нужно подтянуть знания</h2>
                    <p>Вы набрали ${correct}/${questions.length} (${percent}%)</p>
                    <p>Для прохождения нужно 70% (${Math.ceil(questions.length * 0.7)} ответов)</p>
                    <button id="retryBtn" class="btn-primary" style="margin-top: 20px;">Попробовать снова</button>
                `;
            }
            
            document.getElementById('continueBtn')?.addEventListener('click', () => {
                window.location.href = 'dashboard.html';
            });
            document.getElementById('retryBtn')?.addEventListener('click', () => {
                window.location.reload();
            });
        }
    });
}

// ============ PROFILE PAGE ============
if (window.location.pathname.includes('profile.html')) {
    onAuthStateChanged(auth, async (user) => {
        if (!user) { window.location.href = 'index.html'; return; }
        currentUser = user;
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        userData = userSnap.data();
        
        document.getElementById('userEmail').textContent = user.email;
        document.getElementById('totalScore').textContent = userData.totalScore;
        document.getElementById('bestScore').textContent = userData.bestScore || userData.totalScore;
        document.getElementById('maxStreak').textContent = userData.maxStreak || userData.streak;
        document.getElementById('completedLessonsCount').textContent = `${userData.completedLessons?.length || 0}/99`;
        document.getElementById('goldenCrownsCount').textContent = userData.goldenCrowns?.length || 0;
        document.getElementById('profileRank').textContent = userData.rank || "Бронзовый код";
        
        // Достижения
        const completedCount = userData.completedLessons?.length || 0;
        const achievementsList = document.getElementById('achievementsList');
        achievementsList.innerHTML = `
            <p><i class="fas fa-check-circle"></i> Первый урок: ${completedCount >= 1 ? '✅' : '❌'}</p>
            <p><i class="fas fa-check-circle"></i> 10 уроков: ${completedCount >= 10 ? '✅' : '❌'}</p>
            <p><i class="fas fa-check-circle"></i> 25 уроков: ${completedCount >= 25 ? '✅' : '❌'}</p>
            <p><i class="fas fa-check-circle"></i> 50 уроков: ${completedCount >= 50 ? '✅' : '❌'}</p>
            <p><i class="fas fa-check-circle"></i> 99 уроков: ${completedCount >= 99 ? '✅' : '❌'}</p>
            <p><i class="fas fa-fire"></i> 7-дневный стрейк: ${(userData.maxStreak || 0) >= 7 ? '✅' : '❌'}</p>
            <p><i class="fas fa-fire"></i> 30-дневный стрейк: ${(userData.maxStreak || 0) >= 30 ? '✅' : '❌'}</p>
            <p><i class="fas fa-crown"></i> Золотая корона: ${(userData.goldenCrowns?.length || 0) >= 1 ? '✅' : '❌'}</p>
            <p><i class="fas fa-trophy"></i> Мастер Python: ${userData.totalScore >= 8000 ? '✅' : '❌'}</p>
        `;
        
        // Настройки
        const darkModeToggle = document.getElementById('darkModeToggle');
        const soundsToggle = document.getElementById('soundsToggle');
        
        if (userData.settings?.darkMode) {
            darkModeToggle.checked = true;
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            darkModeToggle.checked = false;
            document.documentElement.setAttribute('data-theme', 'light');
        }
        
        soundEnabled = userData.settings?.soundsEnabled !== false;
        soundsToggle.checked = soundEnabled;
        
        darkModeToggle.addEventListener('change', () => {
            const isDark = darkModeToggle.checked;
            document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
            userData.settings = userData.settings || {};
            userData.settings.darkMode = isDark;
            saveUserData();
        });
        
        soundsToggle.addEventListener('change', () => {
            soundEnabled = soundsToggle.checked;
            userData.settings = userData.settings || {};
            userData.settings.soundsEnabled = soundEnabled;
            saveUserData();
        });
        
        document.getElementById('downloadCertificateBtn').addEventListener('click', () => {
            if (userData.totalScore >= 8000) {
                const certificateText = `
╔════════════════════════════════════════╗
║             🐍 PyPath 🐍              ║
║        СЕРТИФИКАТ ОБ ОКОНЧАНИИ        ║
║                                        ║
║   ${user.email}   
║   успешно завершил(а) курс            ║
║   "Python от A1 до C3"                ║
║                                        ║
║   📊 Результаты:                       ║
║   • Очков: ${userData.totalScore}                    ║
║   • Уроков: ${userData.completedLessons?.length || 0}/99        ║
║   • Стрейк: ${userData.streak || 0} дней            ║
║   • Корон: ${userData.goldenCrowns?.length || 0}                  ║
║                                        ║
║        👑 Легенда PyPath 👑           ║
╚════════════════════════════════════════╝
                `;
                alert(certificateText + '\n\nСохраните этот текст как PNG через скриншот');
            } else {
                alert('Сертификат доступен только после достижения ранга "Мастер Python" (8000 очков)');
            }
        });
        
        document.getElementById('resetProgressBtn').addEventListener('click', async () => {
            if (confirm('⚠️ ВНИМАНИЕ! Это удалит ВЕСЬ ваш прогресс. Вы уверены?')) {
                const initialData = getInitialUserData();
                Object.assign(userData, initialData);
                await saveUserData();
                alert('Прогресс сброшен! Страница обновится.');
                window.location.reload();
            }
        });
        
        document.getElementById('logoutBtn')?.addEventListener('click', async () => {
            await signOut(auth);
            window.location.href = 'index.html';
        });
        
        document.getElementById('backBtn')?.addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });
    });
}

// ============ ДОПОЛНИТЕЛЬНЫЕ МОДУЛИ (A2-C3) ============
// Добавляем остальные модули в lessonsData
const additionalModules = {
    A2: [
        { id: "A2_1", title: "Условия if", type: "puzzle", article: "if проверяет условие...", task: { code: ["x = 10", "if x > 5:", "print('Больше')"], expected: "Больше" } },
        { id: "A2_2", title: "else", type: "fill", article: "else выполняется если условие ложно...", task: { code: "x = 3\nif x > 5:\n    print('A')\n___:\n    print('B')", correct: "else" } },
        { id: "A2_3", title: "elif", type: "explain", article: "elif позволяет проверить несколько условий...", task: { question: "Что будет при x=75?", options: ["5", "4", "3"], correct: 1 } },
        { id: "A2_4", title: "Логические операторы", type: "checkbox", article: "and, or, not...", task: { question: "Какие логические операторы есть в Python?", options: ["and", "or", "not", "xor"], correct: [0,1,2] } },
        { id: "A2_5", title: "Практика условий", type: "code", article: "Напиши программу...", task: { description: "Напиши if, который проверяет age >= 18", validator: (c) => c.includes('if') && c.includes('age') } },
        { id: "A2_6", title: "Повторение A2", type: "checkbox", article: "Повторение условий", task: { question: "Что делает elif?", options: ["Проверяет доп. условие", "Завершает программу", "Повторяет код"], correct: [0] } }
    ]
    // B1, B2, C1, C2, C3 добавляются по аналогии (для экономии места)
};

// Объединяем с основными данными
Object.assign(lessonsData, additionalModules);

console.log('🐍 PyPath полностью загружен!');
// Блюр шапки при скролле
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});