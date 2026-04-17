import { auth, db, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, doc, setDoc, getDoc, updateDoc, getInitialUserData } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, where, getDocs, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ============ КОНТЕНТ УРОКОВ ============
const lessonsData = {
    A1: [
        { id: "A1_1", title: "Переменные", code: ["x = 5", "y = 10", "z = x + y", "print(z)"], expected: "15", explain: "Почему `z = x + y` нужно писать ПОСЛЕ того, как x и y объявлены?", explainOptions: ["Потому что Python читает код сверху вниз", "Потому что так красивее", "Потому что иначе будет ошибка"], correctExplain: 0 },
        { id: "A1_2", title: "Типы данных", code: ["name = 'Анна'", "age = 25", "print(name, age)"], expected: "Анна 25", explain: "Какой тип данных у переменной name?", explainOptions: ["int", "str", "float"], correctExplain: 1 },
        { id: "A1_3", title: "print()", code: ["x = 10", "print(f'Значение: {x}')"], expected: "Значение: 10", explain: "Что делает f перед строкой?", explainOptions: ["Форматирование строки", "Умножение", "Ошибка"], correctExplain: 0 }
    ],
    A2: [
        { id: "A2_1", title: "Условия if", code: ["x = 10", "if x > 5:", "print('Больше')"], expected: "Больше", explain: "Что будет, если x = 3?", explainOptions: ["Ничего", "Ошибка", "Больше"], correctExplain: 0 },
        { id: "A2_2", title: "if-else", code: ["age = 16", "if age >= 18:", "print('Доступ есть')", "else:", "print('Доступа нет')"], expected: "Доступа нет", explain: "Почему выполнился блок else?", explainOptions: ["age меньше 18", "Ошибка в коде", "else выполняется всегда"], correctExplain: 0 },
        { id: "A2_3", title: "elif", code: ["mark = 75", "if mark >= 90:", "print('5')", "elif mark >= 70:", "print('4')", "else:", "print('3')"], expected: "4", explain: "Что будет, если mark = 95?", explainOptions: ["5", "4", "3"], correctExplain: 0 }
    ],
    B1: [
        { id: "B1_1", title: "Цикл for", code: ["for i in range(3):", "print(i)"], expected: "0 1 2", explain: "Почему range(3) даёт 0,1,2?", explainOptions: ["range начинается с 0", "range начинается с 1", "Это случайно"], correctExplain: 0 },
        { id: "B1_2", title: "Цикл while", code: ["x = 0", "while x < 3:", "print(x)", "x = x + 1"], expected: "0 1 2", explain: "Что будет, если убрать x = x + 1?", explainOptions: ["Бесконечный цикл", "Ошибка", "Ничего"], correctExplain: 0 },
        { id: "B1_3", title: "range()", code: ["for i in range(2, 5):", "print(i)"], expected: "2 3 4", explain: "Что выведет range(5, 2, -1)?", explainOptions: ["5,4,3", "5,4,3,2", "Ошибка"], correctExplain: 0 }
    ],
    B2: [
        { id: "B2_1", title: "Функции def", code: ["def say_hello():", "print('Привет!')", "say_hello()"], expected: "Привет!", explain: "Что такое def?", explainOptions: ["Объявление функции", "Переменная", "Цикл"], correctExplain: 0 },
        { id: "B2_2", title: "return", code: ["def add(a, b):", "return a + b", "result = add(3, 5)", "print(result)"], expected: "8", explain: "Чем return отличается от print?", explainOptions: ["return возвращает значение", "print возвращает значение", "Это одно и то же"], correctExplain: 0 },
        { id: "B2_3", title: "Аргументы", code: ["def greet(name):", "print(f'Привет, {name}!')", "greet('Анна')"], expected: "Привет, Анна!", explain: "Что такое name в функции?", explainOptions: ["Параметр", "Переменная вне функции", "Ошибка"], correctExplain: 0 }
    ],
    C1: [
        { id: "C1_1", title: "Списки", code: ["numbers = [1, 2, 3]", "numbers.append(4)", "print(numbers)"], expected: "[1, 2, 3, 4]", explain: "Что делает метод append?", explainOptions: ["Добавляет элемент в конец", "Удаляет элемент", "Сортирует список"], correctExplain: 0 },
        { id: "C1_2", title: "Словари", code: ["user = {'name': 'Анна', 'age': 25}", "print(user['name'])"], expected: "Анна", explain: "Что такое ключ в словаре?", explainOptions: ["Идентификатор значения", "Значение", "Список"], correctExplain: 0 },
        { id: "C1_3", title: "List comprehension", code: ["numbers = [1, 2, 3, 4]", "squares = [x*x for x in numbers]", "print(squares)"], expected: "[1, 4, 9, 16]", explain: "Что делает этот код?", explainOptions: ["Возводит числа в квадрат", "Умножает список", "Ошибка"], correctExplain: 0 }
    ],
    C2: [
        { id: "C2_1", title: "Кортежи", code: ["t = (1, 2, 3)", "print(t[0])"], expected: "1", explain: "Можно ли изменить кортеж?", explainOptions: ["Нет, он неизменяемый", "Да", "Только первый элемент"], correctExplain: 0 },
        { id: "C2_2", title: "Множества", code: ["a = {1, 2, 3}", "b = {2, 3, 4}", "print(a & b)"], expected: "{2, 3}", explain: "Что делает оператор &?", explainOptions: ["Пересечение множеств", "Объединение", "Разность"], correctExplain: 0 },
        { id: "C2_3", title: "lambda", code: ["nums = [1, 2, 3]", "squared = list(map(lambda x: x*x, nums))", "print(squared)"], expected: "[1, 4, 9]", explain: "Что такое lambda?", explainOptions: ["Анонимная функция", "Переменная", "Цикл"], correctExplain: 0 }
    ]
};

// ============ ТЕСТЫ ДЛЯ МОДУЛЕЙ ============
const testsData = {
    A1: [
        { question: "Что выведет print(5 + 3)?", options: ["5", "8", "53"], correct: 1 },
        { question: "Какая переменная названа правильно?", options: ["1var", "var_name", "var-name"], correct: 1 },
        { question: "Что такое 'str'?", options: ["Строка", "Число", "Список"], correct: 0 },
        { question: "Какой тип у 3.14?", options: ["int", "float", "str"], correct: 1 },
        { question: "Что выведет print('Hello' + ' ' + 'World')?", options: ["HelloWorld", "Hello World", "Ошибка"], correct: 1 }
    ],
    A2: [
        { question: "Что делает оператор >?", options: ["Меньше", "Больше", "Равно"], correct: 1 },
        { question: "Как записать 'если x больше 5'?", options: ["if x > 5:", "if x < 5:", "if x = 5"], correct: 0 },
        { question: "Что делает else?", options: ["Выполняется если условие ложно", "Всегда выполняется", "Завершает программу"], correct: 0 },
        { question: "Что означает 'and'?", options: ["И", "Или", "Не"], correct: 0 }
    ],
    B1: [
        { question: "Что делает range(5)?", options: ["0,1,2,3,4", "1,2,3,4,5", "Ошибка"], correct: 0 },
        { question: "Как остановить цикл досрочно?", options: ["break", "continue", "stop"], correct: 0 },
        { question: "Что делает continue?", options: ["Пропускает итерацию", "Останавливает цикл", "Завершает программу"], correct: 0 }
    ],
    B2: [
        { question: "Как создать функцию?", options: ["def my_func():", "function my_func():", "func my_func():"], correct: 0 },
        { question: "Что делает return?", options: ["Возвращает значение", "Печатает значение", "Завершает программу"], correct: 0 }
    ],
    C1: [
        { question: "Как получить первый элемент списка?", options: ["list[0]", "list[1]", "list.first()"], correct: 0 },
        { question: "Как добавить элемент в словарь?", options: ["dict['key'] = value", "dict.add('key', value)", "dict.append('key', value)"], correct: 0 }
    ],
    C2: [
        { question: "Чем отличается кортеж от списка?", options: ["Кортеж неизменяем", "Список неизменяем", "Ничем"], correct: 0 },
        { question: "Что делает zip()?", options: ["Объединяет последовательности", "Сжимает данные", "Сортирует"], correct: 0 }
    ]
};

// ============ ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ============
let currentUser = null;
let userData = null;
let currentLesson = null;
let currentTestModule = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let soundEnabled = true;
let correctStreak = 0;

// Звуки
const sounds = {
    correct: new Audio('sounds/correct.mp3'),
    wrong: new Audio('sounds/wrong.mp3'),
    levelup: new Audio('sounds/level-up.mp3'),
    reward: new Audio('sounds/reward.mp3')
};

// ============ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ============
function playSound(soundName) {
    if (soundEnabled && sounds[soundName]) {
        sounds[soundName].play().catch(e => console.log('Sound error:', e));
    }
}

function showMessage(text, type = 'info') {
    const msgDiv = document.getElementById('messageArea');
    if (msgDiv) {
        msgDiv.textContent = text;
        msgDiv.className = `message-area ${type}`;
        setTimeout(() => {
            msgDiv.textContent = '';
            msgDiv.className = 'message-area';
        }, 3000);
    }
}

async function updateUserData(updates) {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, updates);
    Object.assign(userData, updates);
}

async function saveUserData() {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    await setDoc(userRef, userData, { merge: true });
}

// Восстановление энергии и жизней
function updateResources() {
    if (!userData) return;
    const now = Date.now();
    
    // Энергия
    const energyPassed = Math.floor((now - userData.lastEnergyUpdate) / 3600000);
    if (energyPassed > 0) {
        userData.energy = Math.min(5, userData.energy + energyPassed);
        userData.lastEnergyUpdate = now;
    }
    
    // Жизни
    const lifePassed = Math.floor((now - userData.lastLifeUpdate) / 1800000);
    if (lifePassed > 0) {
        userData.lives = Math.min(5, userData.lives + lifePassed);
        userData.lastLifeUpdate = now;
    }
    
    updateUI();
}

// Обновление UI на главной
function updateUI() {
    const energyFill = document.getElementById('energyFill');
    const energyValue = document.getElementById('energyValue');
    const livesFill = document.getElementById('livesFill');
    const livesValue = document.getElementById('livesValue');
    const scoreValue = document.getElementById('scoreValue');
    const streakValue = document.getElementById('streakValue');
    const rankName = document.getElementById('rankName');
    const rankPoints = document.getElementById('rankPoints');
    const rankProgress = document.getElementById('rankProgress');
    
    if (energyFill) energyFill.style.width = `${(userData.energy / 5) * 100}%`;
    if (energyValue) energyValue.textContent = userData.energy;
    if (livesFill) livesFill.style.width = `${(userData.lives / 5) * 100}%`;
    if (livesValue) livesValue.textContent = userData.lives;
    if (scoreValue) scoreValue.textContent = userData.totalScore;
    if (streakValue) streakValue.textContent = userData.streak;
    
    // Ранги
    const ranks = [
        { name: "Бронзовый код", min: 0 },
        { name: "Серебряный код", min: 500 },
        { name: "Золотой код", min: 1500 },
        { name: "Платиновый код", min: 3000 },
        { name: "Алмазный код", min: 5000 },
        { name: "Мастер Python", min: 8000 }
    ];
    
    let currentRank = ranks[0];
    let nextRank = ranks[1];
    for (let i = 0; i < ranks.length; i++) {
        if (userData.totalScore >= ranks[i].min) {
            currentRank = ranks[i];
            nextRank = ranks[i + 1] || null;
        }
    }
    
    if (rankName) rankName.textContent = currentRank.name;
    if (nextRank && rankPoints) {
        const pointsToNext = nextRank.min - userData.totalScore;
        const pointsInRank = userData.totalScore - currentRank.min;
        const rankRange = nextRank.min - currentRank.min;
        const percent = (pointsInRank / rankRange) * 100;
        rankPoints.textContent = `${userData.totalScore} / ${nextRank.min}`;
        if (rankProgress) rankProgress.style.width = `${percent}%`;
    } else if (rankPoints) {
        rankPoints.textContent = `${userData.totalScore} (МАКСИМУМ)`;
        if (rankProgress) rankProgress.style.width = '100%';
    }
}

// Загрузка модулей на дашборд
async function loadModules() {
    const container = document.getElementById('modulesGrid');
    if (!container) return;
    
    const modules = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const moduleNames = {
        A1: '🌱 НАЧИНАЮЩИЙ', A2: '📖 БАЗОВЫЙ', B1: '⚡ СРЕДНИЙ',
        B2: '🚀 ВЫШЕ СРЕДНЕГО', C1: '💎 ПРОДВИНУТЫЙ', C2: '👑 ЭКСПЕРТ'
    };
    
    container.innerHTML = '';
    
    for (let i = 0; i < modules.length; i++) {
        const moduleId = modules[i];
        const isUnlocked = i < userData.modulesUnlocked;
        const lessons = lessonsData[moduleId] || [];
        const completedCount = lessons.filter(l => userData.completedLessons.includes(l.id)).length;
        const percent = (completedCount / lessons.length) * 100;
        
        const card = document.createElement('div');
        card.className = `module-card ${!isUnlocked ? 'locked' : ''}`;
        card.innerHTML = `
            <div class="module-icon">${moduleNames[moduleId].split(' ')[0]}</div>
            <h3>${moduleNames[moduleId]}</h3>
            <p>${moduleId} • ${completedCount}/${lessons.length} уроков</p>
            <div class="progress-bar"><div class="progress-fill" style="width: ${percent}%"></div></div>
            ${!isUnlocked ? '<p class="locked-text">🔒 Пройдите тест предыдущего модуля</p>' : ''}
        `;
        
        if (isUnlocked) {
            card.addEventListener('click', () => {
                window.location.href = `module.html?module=${moduleId}`;
            });
        }
        
        container.appendChild(card);
    }
}

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
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
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
        updateUI();
        loadModules();
        loadDailyQuests();
        loadReviewLessons();
        
        // Проверка ежедневного бонуса
        const today = new Date().toDateString();
        if (userData.lastLogin !== today) {
            const reward = 50;
            userData.totalScore += reward;
            userData.lastLogin = today;
            userData.streak = (userData.streak || 0) + 1;
            await saveUserData();
            showMessage(`🎁 Ежедневный бонус: +${reward} очков! Стрейк: ${userData.streak} дней`, 'success');
            playSound('reward');
        }
        
        // Тема
        if (userData.settings?.darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }
        soundEnabled = userData.settings?.soundsEnabled !== false;
        
        // Кнопки
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
            document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
            userData.settings = userData.settings || {};
            userData.settings.darkMode = !isDark;
            saveUserData();
        });
        
        document.getElementById('soundToggle')?.addEventListener('click', () => {
            soundEnabled = !soundEnabled;
            userData.settings = userData.settings || {};
            userData.settings.soundsEnabled = soundEnabled;
            saveUserData();
            document.getElementById('soundToggle').textContent = soundEnabled ? '🔊' : '🔇';
        });
        document.getElementById('soundToggle').textContent = soundEnabled ? '🔊' : '🔇';
        
        document.getElementById('logoutBtn')?.addEventListener('click', async () => {
            await signOut(auth);
            window.location.href = 'index.html';
        });
        
        document.getElementById('buyLifeBtn')?.addEventListener('click', async () => {
            if (userData.totalScore >= 100 && userData.lives < 5) {
                userData.totalScore -= 100;
                userData.lives = Math.min(5, userData.lives + 1);
                await saveUserData();
                updateUI();
                showMessage('❤️ Жизнь куплена!', 'success');
                playSound('reward');
            } else {
                showMessage('Недостаточно очков или жизни полны', 'error');
            }
        });
    });
}

function loadDailyQuests() {
    const container = document.getElementById('questsList');
    if (!container || !userData) return;
    const today = new Date().toDateString();
    if (userData.dailyQuests?.date !== today) {
        userData.dailyQuests = {
            date: today,
            quests: [
                { id: 1, text: "Пройти 2 урока", target: 2, progress: 0, completed: false, reward: 30 },
                { id: 2, text: "3 правильных 'Объясни' подряд", target: 3, progress: 0, completed: false, reward: "energy" },
                { id: 3, text: "Закончить тест", target: 1, progress: 0, completed: false, reward: 50 }
            ]
        };
        saveUserData();
    }
    
    container.innerHTML = '';
    userData.dailyQuests.quests.forEach(quest => {
        const div = document.createElement('div');
        div.className = `quest-item ${quest.completed ? 'completed' : ''}`;
        div.innerHTML = `
            <span>${quest.completed ? '✅' : '◻️'}</span>
            <span>${quest.text}</span>
            <span>${quest.progress}/${quest.target}</span>
            <span>${typeof quest.reward === 'number' ? `+${quest.reward}⭐` : `+1⚡`}</span>
        `;
        container.appendChild(div);
    });
}

function loadReviewLessons() {
    const container = document.getElementById('reviewLessons');
    if (!container || !userData) return;
    const completed = userData.completedLessons || [];
    if (completed.length === 0) {
        container.innerHTML = '<p>Пока нет пройденных уроков</p>';
        return;
    }
    container.innerHTML = '';
    completed.forEach(lessonId => {
        for (const module in lessonsData) {
            const lesson = lessonsData[module].find(l => l.id === lessonId);
            if (lesson) {
                const btn = document.createElement('button');
                btn.className = 'btn-secondary';
                btn.textContent = `🔄 ${lesson.title}`;
                btn.addEventListener('click', () => {
                    localStorage.setItem('reviewLesson', JSON.stringify(lesson));
                    window.location.href = 'lesson.html?review=true';
                });
                container.appendChild(btn);
                break;
            }
        }
    });
}

// ============ ЗАПУСК ============
console.log('🐍 PyPath загружен!');
// ============ MODULE PAGE ============
if (window.location.pathname.includes('module.html')) {
    onAuthStateChanged(auth, async (user) => {
        if (!user) { window.location.href = 'index.html'; return; }
        currentUser = user;
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        userData = userSnap.data();
        
        const urlParams = new URLSearchParams(window.location.search);
        const moduleId = urlParams.get('module');
        
        const moduleNames = { A1: 'Начинающий', A2: 'Базовый', B1: 'Средний', B2: 'Выше среднего', C1: 'Продвинутый', C2: 'Эксперт' };
        document.getElementById('moduleTitle').textContent = `Модуль ${moduleId}`;
        document.getElementById('moduleDesc').textContent = moduleNames[moduleId];
        
        updateUI();
        
        const lessons = lessonsData[moduleId] || [];
        const container = document.getElementById('lessonsList');
        container.innerHTML = '';
        
        for (let i = 0; i < lessons.length; i++) {
            const lesson = lessons[i];
            const isCompleted = userData.completedLessons?.includes(lesson.id);
            const hasGoldenCrown = userData.goldenCrowns?.includes(lesson.id);
            
            const div = document.createElement('div');
            div.className = `lesson-item ${isCompleted ? 'completed' : ''}`;
            div.innerHTML = `
                <div class="lesson-icon">${hasGoldenCrown ? '👑' : '📘'}</div>
                <div class="lesson-info">
                    <h3>${lesson.title}</h3>
                    <p>Собери код в правильном порядке</p>
                </div>
                <button class="btn-start-lesson" data-lesson-id="${lesson.id}" data-lesson-index="${i}">
                    ${isCompleted ? 'Повторить' : 'Начать'}
                </button>
            `;
            container.appendChild(div);
        }
        
        document.querySelectorAll('.btn-start-lesson').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const lessonId = btn.dataset.lessonId;
                const lessonIndex = parseInt(btn.dataset.lessonIndex);
                const lesson = lessons[lessonIndex];
                
                if (userData.energy < 1) {
                    showMessage('❌ Недостаточно энергии! Подождите восстановления.', 'error');
                    return;
                }
                
                userData.energy -= 1;
                await saveUserData();
                localStorage.setItem('currentLesson', JSON.stringify(lesson));
                localStorage.setItem('lessonModule', moduleId);
                window.location.href = 'lesson.html';
            });
        });
        
        document.getElementById('startTestBtn')?.addEventListener('click', () => {
            localStorage.setItem('testModule', moduleId);
            window.location.href = 'test.html';
        });
        
        document.getElementById('backBtn')?.addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });
    });
}

// ============ LESSON PAGE ============
if (window.location.pathname.includes('lesson.html')) {
    let currentPuzzleOrder = [];
    let correctAnswer = false;
    let explainAnswered = false;
    let hintUsed = false;
    
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
        
        document.getElementById('lessonTitle').textContent = currentLesson.title;
        
        // Перемешиваем пазл
        currentPuzzleOrder = [...currentLesson.code];
        for (let i = currentPuzzleOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [currentPuzzleOrder[i], currentPuzzleOrder[j]] = [currentPuzzleOrder[j], currentPuzzleOrder[i]];
        }
        
        renderPuzzle();
        
        document.getElementById('checkBtn').addEventListener('click', checkPuzzle);
        document.getElementById('hintBtn').addEventListener('click', useHint);
        document.getElementById('exitBtn')?.addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });
        
        // Золотая корона
        if (userData.goldenCrowns?.includes(currentLesson.id)) {
            document.getElementById('goldenCrown').style.display = 'block';
        }
    });
    
    function renderPuzzle() {
        const container = document.getElementById('puzzleContainer');
        container.innerHTML = '';
        currentPuzzleOrder.forEach((piece, idx) => {
            const div = document.createElement('div');
            div.className = 'puzzle-piece';
            div.textContent = piece;
            div.draggable = true;
            div.dataset.index = idx;
            
            div.addEventListener('dragstart', handleDragStart);
            div.addEventListener('dragover', handleDragOver);
            div.addEventListener('drop', handleDrop);
            
            container.appendChild(div);
        });
    }
    
    let draggedIndex = null;
    
    function handleDragStart(e) {
        draggedIndex = parseInt(e.target.dataset.index);
        e.target.classList.add('dragging');
    }
    
    function handleDragOver(e) {
        e.preventDefault();
        e.target.classList.add('drag-over');
    }
    
    function handleDrop(e) {
        e.preventDefault();
        const targetIndex = parseInt(e.target.dataset.index);
        if (!isNaN(draggedIndex) && !isNaN(targetIndex) && draggedIndex !== targetIndex) {
            const newOrder = [...currentPuzzleOrder];
            [newOrder[draggedIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[draggedIndex]];
            currentPuzzleOrder = newOrder;
            renderPuzzle();
        }
        e.target.classList.remove('drag-over');
    }
    
    function checkPuzzle() {
        const isCorrect = currentPuzzleOrder.join('') === currentLesson.code.join('');
        
        if (isCorrect) {
            playSound('correct');
            showMessage('✅ Правильно!', 'success');
            correctAnswer = true;
            document.getElementById('checkBtn').disabled = true;
            
            // Показываем вопрос "Объясни"
            document.getElementById('explainBlock').style.display = 'block';
            document.getElementById('explainQuestion').textContent = currentLesson.explain;
            
            const optionsContainer = document.getElementById('explainOptions');
            optionsContainer.innerHTML = '';
            currentLesson.explainOptions.forEach((opt, idx) => {
                const label = document.createElement('label');
                label.innerHTML = `<input type="radio" name="explain" value="${idx}"> ${opt}`;
                optionsContainer.appendChild(label);
            });
            
            document.getElementById('explainSubmitBtn').onclick = async () => {
                if (explainAnswered) return;
                const selected = document.querySelector('input[name="explain"]:checked');
                if (!selected) {
                    showMessage('Выберите ответ', 'error');
                    return;
                }
                
                const isExplainCorrect = parseInt(selected.value) === currentLesson.correctExplain;
                
                if (isExplainCorrect) {
                    playSound('correct');
                    showMessage('✅ Отлично! Ты понимаешь материал!', 'success');
                    
                    // Награда
                    let reward = 20;
                    if (!userData.completedLessons?.includes(currentLesson.id)) {
                        reward += 30;
                        userData.completedLessons = userData.completedLessons || [];
                        userData.completedLessons.push(currentLesson.id);
                        
                        // Проверка на золотую корону
                        const lessonInModule = lessonsData[Object.keys(lessonsData).find(m => 
                            lessonsData[m].some(l => l.id === currentLesson.id)
                        )];
                        const perfectCount = (userData.goldenCrowns?.length || 0);
                        if (!hintUsed && !userData.goldenCrowns?.includes(currentLesson.id)) {
                            userData.goldenCrowns = userData.goldenCrowns || [];
                            userData.goldenCrowns.push(currentLesson.id);
                            showMessage('👑 ЗОЛОТАЯ КОРОНА! Идеальное прохождение!', 'success');
                            playSound('levelup');
                        }
                    }
                    
                    userData.totalScore += reward;
                    
                    // Восстановление жизни за урок
                    userData.lives = Math.min(5, userData.lives + 1);
                    
                    // Обновляем ежедневные задания
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
                        } else {
                            correctStreak = 0;
                        }
                    }
                    
                    await saveUserData();
                    updateUI();
                    explainAnswered = true;
                    
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 2000);
                    
                } else {
                    playSound('wrong');
                    showMessage('❌ Неправильно! Правильный ответ: ' + currentLesson.explainOptions[currentLesson.correctExplain], 'error');
                    userData.lives = Math.max(0, userData.lives - 1);
                    correctStreak = 0;
                    await saveUserData();
                    updateUI();
                    
                    if (userData.lives <= 0) {
                        showMessage('💀 Жизни кончились! Возврат на главную...', 'error');
                        setTimeout(() => {
                            window.location.href = 'dashboard.html';
                        }, 2000);
                    } else {
                        document.getElementById('explainBlock').style.display = 'none';
                        correctAnswer = false;
                        document.getElementById('checkBtn').disabled = false;
                    }
                }
            };
            
        } else {
            playSound('wrong');
            showMessage('❌ Неправильный порядок! Попробуй ещё раз.', 'error');
            userData.lives = Math.max(0, userData.lives - 1);
            correctStreak = 0;
            saveUserData();
            updateUI();
            
            if (userData.lives <= 0) {
                showMessage('💀 Жизни кончились! Возврат на главную...', 'error');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
            }
        }
    }
    
    function useHint() {
        if (hintUsed) {
            showMessage('Подсказка уже использована', 'info');
            return;
        }
        if (userData.totalScore < 20) {
            showMessage('Недостаточно очков для подсказки (нужно 20)', 'error');
            return;
        }
        
        userData.totalScore -= 20;
        hintUsed = true;
        
        // Подсказка: подсвечиваем правильный первый элемент
        const correctFirst = currentLesson.code[0];
        const pieces = document.querySelectorAll('.puzzle-piece');
        for (let i = 0; i < pieces.length; i++) {
            if (pieces[i].textContent === correctFirst) {
                pieces[i].style.border = '2px solid #4ecdc4';
                pieces[i].style.background = 'rgba(78, 205, 196, 0.2)';
                break;
            }
        }
        
        saveUserData();
        updateUI();
        showMessage('💡 Первый элемент подсвечен!', 'success');
    }
}

// ============ TEST PAGE ============
if (window.location.pathname.includes('test.html')) {
    let testModule = null;
    let questions = [];
    let answers = [];
    
    onAuthStateChanged(auth, async (user) => {
        if (!user) { window.location.href = 'index.html'; return; }
        currentUser = user;
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        userData = userSnap.data();
        
        testModule = localStorage.getItem('testModule');
        questions = testsData[testModule] || [];
        answers = new Array(questions.length).fill(null);
        
        document.getElementById('testTitle').textContent = `Тест модуля ${testModule}`;
        document.getElementById('totalQuestions').textContent = questions.length;
        
        loadQuestion(0);
        
        document.getElementById('prevBtn').addEventListener('click', () => {
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
                loadQuestion(currentQuestionIndex);
            }
        });
        
        document.getElementById('nextBtn').addEventListener('click', () => {
            const selected = document.querySelector('input[name="answer"]:checked');
            if (selected) {
                answers[currentQuestionIndex] = parseInt(selected.value);
            }
            if (currentQuestionIndex < questions.length - 1) {
                currentQuestionIndex++;
                loadQuestion(currentQuestionIndex);
            } else {
                document.getElementById('nextBtn').style.display = 'none';
                document.getElementById('submitTestBtn').style.display = 'block';
            }
        });
        
        document.getElementById('submitTestBtn').addEventListener('click', submitTest);
        document.getElementById('exitBtn')?.addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });
    });
    
    function loadQuestion(index) {
        const q = questions[index];
        const container = document.getElementById('questionContainer');
        container.innerHTML = `
            <div class="question-card">
                <h3>Вопрос ${index + 1}</h3>
                <p>${q.question}</p>
                <div class="options">
                    ${q.options.map((opt, i) => `
                        <label class="option">
                            <input type="radio" name="answer" value="${i}" ${answers[index] === i ? 'checked' : ''}>
                            ${opt}
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.getElementById('prevBtn').disabled = index === 0;
        document.getElementById('correctCount').textContent = answers.filter(a => a !== null).length;
        document.getElementById('testProgress').style.width = `${((index + 1) / questions.length) * 100}%`;
    }
    
    async function submitTest() {
        let correct = 0;
        for (let i = 0; i < questions.length; i++) {
            if (answers[i] === questions[i].correct) correct++;
        }
        
        const percent = (correct / questions.length) * 100;
        const passed = percent >= 70;
        
        const resultDiv = document.getElementById('testResult');
        resultDiv.style.display = 'block';
        
        if (passed) {
            const reward = correct >= 9 ? 100 : 50;
            userData.totalScore += reward;
            
            // Открываем следующий модуль
            const moduleOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
            const currentIndex = moduleOrder.indexOf(testModule);
            if (currentIndex + 1 > userData.modulesUnlocked) {
                userData.modulesUnlocked = currentIndex + 2;
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
            
            resultDiv.innerHTML = `
                <div class="test-passed">
                    <h2>🎉 Поздравляем! 🎉</h2>
                    <p>Вы набрали ${correct}/${questions.length} (${percent}%)</p>
                    <p>Модуль ${testModule} пройден! +${reward} очков</p>
                    <p>✨ Открыт следующий модуль! ✨</p>
                    <button id="continueBtn" class="btn-primary">Продолжить</button>
                </div>
            `;
            playSound('levelup');
        } else {
            resultDiv.innerHTML = `
                <div class="test-failed">
                    <h2>😔 Нужно подтянуть знания</h2>
                    <p>Вы набрали ${correct}/${questions.length} (${percent}%)</p>
                    <p>Для прохождения нужно 70% (${Math.ceil(questions.length * 0.7)} ответов)</p>
                    <button id="retryBtn" class="btn-primary">Попробовать снова</button>
                </div>
            `;
            playSound('wrong');
        }
        
        document.getElementById('continueBtn')?.addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });
        document.getElementById('retryBtn')?.addEventListener('click', () => {
            window.location.reload();
        });
        
        document.querySelector('.test-controls').style.display = 'none';
    }
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
        document.getElementById('completedLessonsCount').textContent = (userData.completedLessons?.length || 0) + '/36';
        document.getElementById('goldenCrownsCount').textContent = userData.goldenCrowns?.length || 0;
        
        // Достижения
        const completedCount = userData.completedLessons?.length || 0;
        document.getElementById('achFirstLesson').innerHTML = completedCount >= 1 ? '✅' : '❌';
        document.getElementById('ach10Lessons').innerHTML = completedCount >= 10 ? '✅' : '❌';
        document.getElementById('ach20Lessons').innerHTML = completedCount >= 20 ? '✅' : '❌';
        document.getElementById('ach30Lessons').innerHTML = completedCount >= 30 ? '✅' : '❌';
        document.getElementById('achAllLessons').innerHTML = completedCount >= 36 ? '✅' : '❌';
        document.getElementById('ach7Streak').innerHTML = (userData.streak >= 7) ? '✅' : '❌';
        document.getElementById('ach30Streak').innerHTML = (userData.streak >= 30) ? '✅' : '❌';
        document.getElementById('achGoldenCrown').innerHTML = (userData.goldenCrowns?.length >= 1) ? '✅' : '❌';
        document.getElementById('achMaster').innerHTML = userData.totalScore >= 8000 ? '✅' : '❌';
        
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
        
        document.getElementById('downloadCertificateBtn')?.addEventListener('click', () => {
            if (userData.totalScore >= 8000) {
                alert('🎓 Сертификат:\n\n' +
                      '╔══════════════════════════════════╗\n' +
                      '║         🐍 PyPath 🐍            ║\n' +
                      '║     СЕРТИФИКАТ ОБ ОКОНЧАНИИ     ║\n' +
                      '║                                  ║\n' +
                      `║   ${user.email}   ║\n` +
                      '║   успешно завершил(а) курс      ║\n' +
                      '║   "Python от A1 до C2"          ║\n' +
                      '║                                  ║\n' +
                      `║   Очков: ${userData.totalScore}          ║\n` +
                      `║   Стрейк: ${userData.streak} дней        ║\n` +
                      `║   Золотых корон: ${userData.goldenCrowns?.length || 0}     ║\n` +
                      '║                                  ║\n' +
                      '║        🎓 Легенда PyPath 🎓       ║\n' +
                      '╚══════════════════════════════════╝\n' +
                      '\n(сохраните этот текст как PNG через скриншот)');
            } else {
                alert('Сертификат доступен только после достижения ранга "Мастер Python" (8000 очков)');
            }
        });
        
        document.getElementById('resetProgressBtn')?.addEventListener('click', async () => {
            if (confirm('⚠️ ВНИМАНИЕ! Это удалит ВЕСЬ ваш прогресс. Вы уверены?')) {
                const initialData = getInitialUserData();
                Object.assign(userData, initialData);
                await saveUserData();
                alert('Прогресс сброшен! Страница обновится.');
                window.location.reload();
            }
        });
        
        document.getElementById('logoutProfileBtn')?.addEventListener('click', async () => {
            await signOut(auth);
            window.location.href = 'index.html';
        });
        
        document.getElementById('backBtn')?.addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });
    });
}