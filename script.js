import { 
    auth, db, 
    signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail,
    onAuthStateChanged, signOut,
    doc, setDoc, getDoc, updateDoc,
    getInitialUserData
} from './firebase-config.js';

// ============ ЗВУКИ ============
let soundEnabled = true;

function playSound(soundName) {
    if (!soundEnabled) return;
    const audio = new Audio(`sounds/${soundName}.mp3`);
    audio.play().catch(() => {});
}

// ============ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ============
function showMessage(text, type = 'info') {
    const msgDiv = document.getElementById('messageArea');
    if (msgDiv) {
        let icon = '';
        if (type === 'success') icon = '<i class="fas fa-check-circle"></i> ';
        else if (type === 'error') icon = '<i class="fas fa-times-circle"></i> ';
        else icon = '<i class="fas fa-info-circle"></i> ';
        msgDiv.innerHTML = icon + text;
        msgDiv.className = `message ${type}`;
        setTimeout(() => {
            msgDiv.innerHTML = '';
            msgDiv.className = 'message';
        }, 3000);
    }
}

async function saveUserData() {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    await setDoc(userRef, userData, { merge: true });
}

// ============ ФУНКЦИЯ ОБНОВЛЕНИЯ UI ============
function updateUI() {
    const energyEl = document.getElementById('energyValue');
    const livesEl = document.getElementById('livesValue');
    const scoreEl = document.getElementById('scoreValue');
    const streakEl = document.getElementById('streakValue');
    if (energyEl) energyEl.textContent = userData?.energy || 5;
    if (livesEl) livesEl.textContent = userData?.lives || 5;
    if (scoreEl) scoreEl.textContent = userData?.totalScore || 0;
    if (streakEl) streakEl.textContent = userData?.streak || 0;
    
    const energyValue2 = document.getElementById('energyValue2');
    const livesValue2 = document.getElementById('livesValue2');
    if (energyValue2) energyValue2.textContent = userData?.energy || 5;
    if (livesValue2) livesValue2.textContent = userData?.lives || 5;
    
    const nextEnergyEl = document.getElementById('nextEnergyTime');
    if (nextEnergyEl && userData) {
        if (userData.energy < 5) {
            const nextTime = userData.lastEnergyUpdate + 3600000;
            const diff = nextTime - Date.now();
            if (diff > 0) {
                const minutes = Math.floor(diff / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                nextEnergyEl.textContent = `${minutes}м ${seconds}с`;
            } else {
                nextEnergyEl.textContent = 'скоро';
            }
        } else {
            nextEnergyEl.textContent = 'полна';
        }
    }
}

// ============ ОБНОВЛЕНИЕ РЕСУРСОВ ============
function updateResources() {
    if (!userData) return;
    const now = Date.now();
    
    const energyPassed = Math.floor((now - userData.lastEnergyUpdate) / 3600000);
    if (energyPassed > 0) {
        userData.energy = Math.min(5, userData.energy + energyPassed);
        userData.lastEnergyUpdate = now;
    }
    
    const lifePassed = Math.floor((now - userData.lastLifeUpdate) / 1800000);
    if (lifePassed > 0) {
        userData.lives = Math.min(5, userData.lives + lifePassed);
        userData.lastLifeUpdate = now;
    }
    
    updateUI();
}

let currentUser = null;
let userData = null;

// ============ РАНГИ ============
const ranks = [
    { name: 'Бронзовый код', min: 0 },
    { name: 'Серебряный код', min: 500 },
    { name: 'Золотой код', min: 1500 },
    { name: 'Платиновый код', min: 3000 },
    { name: 'Алмазный код', min: 5000 },
    { name: 'Мастер Python', min: 8000 }
];

function getRank(score) {
    let currentRank = ranks[0];
    for (let r of ranks) {
        if (score >= r.min) currentRank = r;
    }
    return currentRank;
}

// ============ ДАННЫЕ МОДУЛЕЙ ============
const modulesList = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'C3'];
const moduleNames = {
    A1: 'Основы Python',
    A2: 'Условия',
    B1: 'Циклы',
    B2: 'Функции',
    C1: 'Структуры данных',
    C2: 'Продвинутые темы',
    C3: 'ООП и финал'
};

const moduleIcons = {
    A1: 'seedling',
    A2: 'book',
    B1: 'bolt',
    B2: 'rocket',
    C1: 'gem',
    C2: 'fire',
    C3: 'crown'
};

const lessonTitles = {
    A1: ['Переменные', 'Типы данных', 'print()', 'input()', 'Приведение типов', 'Арифметика', 'Строки', 'f-строки', 'Булевы значения', 'Условия if', 'Практика 1', 'Практика 2', 'Практика 3', 'Повторение'],
    A2: ['if', 'else', 'elif', 'and/or/not', 'Вложенные условия', 'Тернарный оператор', 'Сравнение строк', 'Сравнение чисел', 'Логические цепочки', 'Практика 1', 'Практика 2', 'Практика 3', 'Практика 4', 'Повторение'],
    B1: ['for', 'range()', 'while', 'break', 'continue', 'else в циклах', 'Вложенные циклы', 'Бесконечные циклы', 'enumerate', 'Практика 1', 'Практика 2', 'Практика 3', 'Практика 4', 'Повторение'],
    B2: ['def', 'Аргументы', 'return', 'None', 'Область видимости', '*args', '**kwargs', 'lambda', 'map/filter', 'Рекурсия', 'Документация', 'Практика 1', 'Практика 2', 'Повторение'],
    C1: ['Списки', 'Методы списков', 'Срезы', 'Словари', 'Методы словарей', 'Множества', 'Кортежи', 'list comprehension', 'dict comprehension', 'Распаковка', 'Копирование', 'Практика 1', 'Практика 2', 'Повторение'],
    C2: ['enumerate', 'zip', 'sorted', 'any/all', 'Генераторы', 'try/except', 'Работа с файлами', 'Модули', 'datetime', 'random', 'Практика 1', 'Практика 2', 'Практика 3', 'Повторение'],
    C3: ['Классы', 'self', '__init__', 'Наследование', 'Магические методы', 'property', 'Статические методы', 'Исключения в ООП', 'Финальный проект', 'Практика 1', 'Практика 2', 'Практика 3', 'Практика 4', 'Повторение']
};

// ============ ТЕСТЫ (15 вопросов для каждого модуля) ============
const testsData = {
    A1: [
        { text: 'Что выведет print(5 + 3)?', options: ['5', '8', '53'], correct: 1 },
        { text: 'Какой тип данных у "Hello"?', options: ['int', 'str', 'float'], correct: 1 },
        { text: 'Какая переменная названа правильно?', options: ['1var', 'var_name', 'var-name'], correct: 1 },
        { text: 'Что делает input()?', options: ['Выводит текст', 'Читает ввод', 'Завершает программу'], correct: 1 },
        { text: 'Как преобразовать строку "5" в число?', options: ['str("5")', 'int("5")', 'float("5")'], correct: 1 },
        { text: 'Что вернёт type(3.14)?', options: ['int', 'float', 'str'], correct: 1 },
        { text: 'Как вывести "Привет мир"?', options: ['print("Привет мир")', 'output("Привет мир")', 'console.log("Привет мир")'], correct: 0 },
        { text: 'Что такое переменная?', options: ['Контейнер для данных', 'Функция', 'Цикл'], correct: 0 },
        { text: 'Какое имя переменной корректно?', options: ['_myVar', '2myVar', 'my-var'], correct: 0 },
        { text: 'Что делает f-строка?', options: ['Форматирует строку', 'Умножает строку', 'Создаёт список'], correct: 0 },
        { text: 'Какой результат 5 // 2?', options: ['2', '2.5', '3'], correct: 0 },
        { text: 'Какой результат 5 % 2?', options: ['1', '2', '0'], correct: 0 },
        { text: 'Что такое bool?', options: ['Булев тип', 'Строка', 'Число'], correct: 0 },
        { text: 'Что вернёт 5 > 3?', options: ['True', 'False', 'Ошибка'], correct: 0 },
        { text: 'Какой оператор сравнения "равно"?', options: ['=', '==', '!='], correct: 1 }
    ],
    A2: [
        { text: 'Какой оператор проверяет "больше"?', options: ['>', '<', '=='], correct: 0 },
        { text: 'Что выведет print(5 > 3)?', options: ['True', 'False', '5 > 3'], correct: 0 },
        { text: 'Какой оператор "и" в Python?', options: ['and', 'or', 'not'], correct: 0 },
        { text: 'Какой оператор "или" в Python?', options: ['or', 'and', 'not'], correct: 0 },
        { text: 'Что делает else?', options: ['Выполняется если условие ложно', 'Выполняется всегда', 'Завершает программу'], correct: 0 },
        { text: 'Что делает elif?', options: ['Проверяет доп. условие', 'Завершает программу', 'Создаёт цикл'], correct: 0 },
        { text: 'Какое значение у not True?', options: ['False', 'True', 'None'], correct: 0 },
        { text: 'Что выведет if 5: print("Да")?', options: ['Да', 'Ничего', 'Ошибку'], correct: 0 },
        { text: 'Как записать "x не равно 5"?', options: ['x != 5', 'x =! 5', 'x <> 5'], correct: 0 },
        { text: 'Что делает оператор "is"?', options: ['Сравнивает объекты', 'Присваивает', 'Складывает'], correct: 0 },
        { text: 'Что выведет print(5 == "5")?', options: ['False', 'True', 'Ошибку'], correct: 0 },
        { text: 'Какое условие верное для x от 5 до 10?', options: ['x > 5 and x < 10', 'x > 5 or x < 10', 'x > 5 not x < 10'], correct: 0 },
        { text: 'Что делает pass?', options: ['Ничего', 'Останавливает код', 'Повторяет код'], correct: 0 },
        { text: 'Какой результат 5 > 3 and 2 < 4?', options: ['True', 'False', 'Ошибка'], correct: 0 },
        { text: 'Что выведет if x = 5?', options: ['Ошибку', 'True', 'False'], correct: 0 }
    ],
    B1: [
        { text: 'Что делает цикл for?', options: ['Повторяет код', 'Проверяет условие', 'Создаёт функцию'], correct: 0 },
        { text: 'Что выведет range(3)?', options: ['0,1,2', '1,2,3', '0,1,2,3'], correct: 0 },
        { text: 'Что делает break?', options: ['Прерывает цикл', 'Пропускает итерацию', 'Завершает программу'], correct: 0 },
        { text: 'Что делает continue?', options: ['Пропускает итерацию', 'Прерывает цикл', 'Повторяет цикл'], correct: 0 },
        { text: 'Какой цикл выполняется пока условие True?', options: ['while', 'for', 'if'], correct: 0 },
        { text: 'Что выведет for i in range(2,5): print(i)?', options: ['2,3,4', '2,3,4,5', '0,1,2'], correct: 0 },
        { text: 'Что будет при бесконечном цикле?', options: ['Зависание', 'Ошибка', 'Завершение'], correct: 0 },
        { text: 'Как выйти из while?', options: ['break', 'continue', 'exit'], correct: 0 },
        { text: 'Что делает enumerate?', options: ['Возвращает индекс и значение', 'Сортирует', 'Суммирует'], correct: 0 },
        { text: 'Что выведет for i in "Python"?', options: ['P,y,t,h,o,n', 'Python', 'Ошибку'], correct: 0 },
        { text: 'Как создать цикл от 1 до 10?', options: ['range(1,11)', 'range(1,10)', 'range(0,10)'], correct: 0 },
        { text: 'Что делает else в цикле?', options: ['Выполняется если не было break', 'Выполняется всегда', 'Завершает цикл'], correct: 0 },
        { text: 'Что выведет for i in range(3): print(i, end=" ")?', options: ['0 1 2', '1 2 3', '0,1,2'], correct: 0 },
        { text: 'Как прервать while?', options: ['break', 'stop', 'exit'], correct: 0 },
        { text: 'Что делает list(range(5))?', options: ['[0,1,2,3,4]', '[1,2,3,4,5]', '[0,1,2,3,4,5]'], correct: 0 }
    ],
    B2: [
        { text: 'Что делает def?', options: ['Объявляет функцию', 'Создаёт цикл', 'Проверяет условие'], correct: 0 },
        { text: 'Что делает return?', options: ['Возвращает значение', 'Выводит значение', 'Завершает программу'], correct: 0 },
        { text: 'Что такое аргумент функции?', options: ['Входное значение', 'Выходное значение', 'Имя функции'], correct: 0 },
        { text: 'Что выведет def f(): return 5; print(f())?', options: ['5', 'None', 'Ошибку'], correct: 0 },
        { text: 'Что такое *args?', options: ['Много аргументов', 'Один аргумент', 'Ключевые аргументы'], correct: 0 },
        { text: 'Что такое **kwargs?', options: ['Именованные аргументы', 'Много аргументов', 'Список аргументов'], correct: 0 },
        { text: 'Что делает lambda?', options: ['Анонимную функцию', 'Цикл', 'Условие'], correct: 0 },
        { text: 'Что выведет (lambda x: x*2)(5)?', options: ['10', '25', '5'], correct: 0 },
        { text: 'Что делает map?', options: ['Применяет функцию к списку', 'Фильтрует список', 'Сортирует список'], correct: 0 },
        { text: 'Что делает filter?', options: ['Фильтрует по условию', 'Применяет функцию', 'Сортирует'], correct: 0 },
        { text: 'Что такое рекурсия?', options: ['Функция вызывает себя', 'Цикл внутри функции', 'Условие в функции'], correct: 0 },
        { text: 'Что выведет def f(): pass?', options: ['None', 'Ошибку', 'Пустоту'], correct: 0 },
        { text: 'Что такое область видимости?', options: ['Где доступна переменная', 'Тип переменной', 'Значение переменной'], correct: 0 },
        { text: 'Что выведет def f(a,b=5): return a+b; print(f(3))?', options: ['8', '3', '5'], correct: 0 },
        { text: 'Что делает return без значения?', options: ['Возвращает None', 'Ошибку', 'Пустоту'], correct: 0 }
    ],
    C1: [
        { text: 'Как создать список?', options: ['[]', '{}', '()'], correct: 0 },
        { text: 'Как получить первый элемент списка?', options: ['list[0]', 'list[1]', 'list.first()'], correct: 0 },
        { text: 'Что делает append?', options: ['Добавляет в конец', 'Добавляет в начало', 'Удаляет элемент'], correct: 0 },
        { text: 'Что делает pop?', options: ['Удаляет последний элемент', 'Удаляет первый', 'Добавляет элемент'], correct: 0 },
        { text: 'Что делает len(list)?', options: ['Длину списка', 'Сумму элементов', 'Максимум'], correct: 0 },
        { text: 'Что делает list[1:3]?', options: ['Срез', 'Индекс', 'Метод'], correct: 0 },
        { text: 'Как создать словарь?', options: ['{}', '[]', '()'], correct: 0 },
        { text: 'Как получить значение по ключу?', options: ['dict["key"]', 'dict.key', 'dict->key'], correct: 0 },
        { text: 'Что делает keys()?', options: ['Возвращает ключи', 'Возвращает значения', 'Возвращает пары'], correct: 0 },
        { text: 'Что делает values()?', options: ['Возвращает значения', 'Возвращает ключи', 'Возвращает пары'], correct: 0 },
        { text: 'Что такое кортеж?', options: ['Неизменяемый список', 'Изменяемый список', 'Словарь'], correct: 0 },
        { text: 'Как создать множество?', options: ['set()', '{}', '[]'], correct: 0 },
        { text: 'Что делает list comprehension?', options: ['Создаёт список', 'Сортирует', 'Фильтрует'], correct: 0 },
        { text: 'Что выведет [x*2 for x in [1,2,3]]?', options: ['[2,4,6]', '[1,2,3]', '[2,4,6,8]'], correct: 0 },
        { text: 'Что делает in для списка?', options: ['Проверяет наличие', 'Добавляет элемент', 'Удаляет элемент'], correct: 0 }
    ],
    C2: [
        { text: 'Что делает enumerate?', options: ['Индекс + значение', 'Сортировка', 'Фильтрация'], correct: 0 },
        { text: 'Что делает zip?', options: ['Объединяет списки', 'Сжимает данные', 'Сортирует'], correct: 0 },
        { text: 'Что делает sorted?', options: ['Сортирует', 'Фильтрует', 'Переворачивает'], correct: 0 },
        { text: 'Что делает any?', options: ['True если есть True', 'True если все True', 'False если есть True'], correct: 0 },
        { text: 'Что делает all?', options: ['True если все True', 'True если есть True', 'False если все True'], correct: 0 },
        { text: 'Что делает try/except?', options: ['Обрабатывает ошибки', 'Создаёт цикл', 'Определяет функцию'], correct: 0 },
        { text: 'Что делает open()?', options: ['Открывает файл', 'Закрывает файл', 'Создаёт файл'], correct: 0 },
        { text: 'Что делает read()?', options: ['Читает файл', 'Записывает файл', 'Закрывает файл'], correct: 0 },
        { text: 'Что делает write()?', options: ['Записывает в файл', 'Читает файл', 'Открывает файл'], correct: 0 },
        { text: 'Что делает import?', options: ['Подключает модуль', 'Создаёт модуль', 'Удаляет модуль'], correct: 0 },
        { text: 'Что делает datetime?', options: ['Работа с датой', 'Работа с файлами', 'Работа с сетью'], correct: 0 },
        { text: 'Что делает random?', options: ['Генерация чисел', 'Сортировка', 'Фильтрация'], correct: 0 },
        { text: 'Что делает randint(1,10)?', options: ['Число от 1 до 10', 'Число от 0 до 10', 'Число от 1 до 9'], correct: 0 },
        { text: 'Что делает choice([1,2,3])?', options: ['Случайный элемент', 'Первый элемент', 'Последний элемент'], correct: 0 },
        { text: 'Что делает finally?', options: ['Выполняется всегда', 'Выполняется при ошибке', 'Выполняется при успехе'], correct: 0 }
    ],
    C3: [
        { text: 'Что такое класс?', options: ['Шаблон для объектов', 'Функция', 'Переменная'], correct: 0 },
        { text: 'Что такое объект?', options: ['Экземпляр класса', 'Функция класса', 'Переменная класса'], correct: 0 },
        { text: 'Что делает __init__?', options: ['Конструктор', 'Деструктор', 'Метод'], correct: 0 },
        { text: 'Что такое self?', options: ['Ссылка на объект', 'Ключевое слово', 'Переменная'], correct: 0 },
        { text: 'Что такое наследование?', options: ['Класс берёт методы другого', 'Класс копирует другой', 'Класс удаляет другой'], correct: 0 },
        { text: 'Что делает super()?', options: ['Вызов родительского класса', 'Вызов дочернего класса', 'Вызов функции'], correct: 0 },
        { text: 'Что такое полиморфизм?', options: ['Разные реализации метода', 'Одна реализация', 'Без реализации'], correct: 0 },
        { text: 'Что такое инкапсуляция?', options: ['Скрытие данных', 'Открытие данных', 'Копирование данных'], correct: 0 },
        { text: 'Как создать приватный метод?', options: ['__method', '_method', 'private_method'], correct: 0 },
        { text: 'Что делает @staticmethod?', options: ['Метод без self', 'Метод с self', 'Метод класса'], correct: 0 },
        { text: 'Что делает @classmethod?', options: ['Метод с cls', 'Метод с self', 'Обычный метод'], correct: 0 },
        { text: 'Что делает property?', options: ['Геттер/сеттер', 'Метод', 'Переменная'], correct: 0 },
        { text: 'Что такое магический метод?', options: ['__method__', '_method_', 'method_'], correct: 0 },
        { text: 'Что делает __str__?', options: ['Строковое представление', 'Числовое представление', 'Список'], correct: 0 },
        { text: 'Что делает __repr__?', options: ['Представление для разработчика', 'Представление для пользователя', 'Числовое представление'], correct: 0 }
    ]
};

// ============ АУТЕНТИФИКАЦИЯ ============
if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabs = document.querySelectorAll('.tab');
    const forgotLink = document.getElementById('forgotPassword');
    
    if (tabs) {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
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
                const msgDiv = document.getElementById('authMessage');
                msgDiv.textContent = 'Ошибка: ' + error.message;
                msgDiv.className = 'message error';
            }
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const confirm = document.getElementById('regConfirm').value;
            const msgDiv = document.getElementById('authMessage');
            
            if (password !== confirm) {
                msgDiv.textContent = 'Пароли не совпадают';
                msgDiv.className = 'message error';
                return;
            }
            if (password.length < 6) {
                msgDiv.textContent = 'Пароль должен быть минимум 6 символов';
                msgDiv.className = 'message error';
                return;
            }
            try {
                const userCred = await createUserWithEmailAndPassword(auth, email, password);
                const initialData = getInitialUserData();
                await setDoc(doc(db, 'users', userCred.user.uid), initialData);
                window.location.href = 'dashboard.html';
            } catch (error) {
                msgDiv.textContent = 'Ошибка: ' + error.message;
                msgDiv.className = 'message error';
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
        updateUI();
        loadModules();
        
        soundEnabled = userData.settings?.soundsEnabled !== false;
        
        const today = new Date().toDateString();
        const lastLoginDate = userData.lastLogin ? new Date(userData.lastLogin).toDateString() : null;
        
        if (lastLoginDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastLoginDate === yesterday.toDateString()) {
                userData.streak = (userData.streak || 0) + 1;
                userData.maxStreak = Math.max(userData.maxStreak, userData.streak);
                showMessage(`Стрейк: ${userData.streak} дней!`, 'success');
            } else if (lastLoginDate !== yesterday.toDateString() && lastLoginDate !== today) {
                userData.streak = 1;
            }
            userData.lastLogin = Date.now();
            userData.totalScore += 50;
            showMessage(`Ежедневный бонус: +50 очков!`, 'success');
            playSound('reward');
            await saveUserData();
        }
        
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
        
        loadDailyQuests();
        
        document.getElementById('avatarBtn').onclick = () => window.location.href = 'profile.html';
        document.getElementById('streakBtn').onclick = () => alert(`Ваш стрейк: ${userData.streak || 0} дней`);
        document.getElementById('continueBtn').onclick = () => {
            const next = findNextLesson();
            window.location.href = `lesson.html?module=${next.module}&lesson=${next.id}`;
        };
        
        const buyEnergyBtn = document.getElementById('buyEnergyBtn');
        const buyLifeBtn = document.getElementById('buyLifeBtn');
        
        if (buyEnergyBtn) {
            buyEnergyBtn.onclick = async () => {
                if (userData.totalScore >= 50 && userData.energy < 5) {
                    userData.totalScore -= 50;
                    userData.energy = Math.min(5, userData.energy + 1);
                    await saveUserData();
                    updateUI();
                    showMessage('+1 энергия!', 'success');
                    playSound('reward');
                } else {
                    showMessage('Недостаточно очков или энергия полна', 'error');
                }
            };
        }
        
        if (buyLifeBtn) {
            buyLifeBtn.onclick = async () => {
                if (userData.totalScore >= 100 && userData.lives < 5) {
                    userData.totalScore -= 100;
                    userData.lives = Math.min(5, userData.lives + 1);
                    await saveUserData();
                    updateUI();
                    showMessage('+1 жизнь!', 'success');
                    playSound('reward');
                } else {
                    showMessage('Недостаточно очков или жизни полны', 'error');
                }
            };
        }
        
        function findNextLesson() {
            for (let m of modulesList) {
                const moduleIndex = modulesList.indexOf(m);
                if (moduleIndex + 1 > (userData.modulesUnlocked || 1)) continue;
                const completed = userData.completedLessons?.filter(l => l.startsWith(m)).length || 0;
                if (completed < 14) {
                    return { module: m, id: completed + 1 };
                }
            }
            return { module: 'A1', id: 1 };
        }
        
        async function loadModules() {
            const container = document.getElementById('modulesGrid');
            if (!container) return;
            container.innerHTML = '';
            const unlocked = userData.modulesUnlocked || 1;
            
            for (let i = 0; i < modulesList.length; i++) {
                const moduleId = modulesList[i];
                const isUnlocked = i < unlocked;
                const completed = userData.completedLessons?.filter(l => l.startsWith(moduleId)).length || 0;
                const progress = (completed / 14) * 100;
                
                const card = document.createElement('div');
                card.className = `module-card ${!isUnlocked ? 'locked' : ''}`;
                card.innerHTML = `
                    <div class="module-icon"><i class="fas fa-${moduleIcons[moduleId]}"></i></div>
                    <h3>Модуль ${moduleId}</h3>
                    <p>${moduleNames[moduleId]}</p>
                    <div class="progress-bar"><div class="progress-fill" style="width: ${progress}%"></div></div>
                    <span>${completed}/14 уроков</span>
                `;
                if (isUnlocked) {
                    card.onclick = () => window.location.href = `module.html?module=${moduleId}`;
                }
                container.appendChild(card);
            }
        }
        
        function loadDailyQuests() {
            const container = document.getElementById('questsList');
            if (!container) return;
            container.innerHTML = '';
            for (let q of userData.dailyQuests.quests) {
                const div = document.createElement('div');
                div.className = `quest-item ${q.completed ? 'completed' : ''}`;
                const rewardText = q.type === 'points' ? `+${q.reward} очков` : `+${q.reward} энергии`;
                div.innerHTML = `
                    <span>${q.completed ? '✓' : '○'}</span>
                    <span>${q.text}</span>
                    <span>${q.progress}/${q.target}</span>
                    <span>${rewardText}</span>
                `;
                container.appendChild(div);
            }
        }
    });
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
        const moduleId = urlParams.get('module') || 'A1';
        
        const icon = document.getElementById('moduleIcon');
        if (icon) icon.innerHTML = `<i class="fas fa-${moduleIcons[moduleId]}"></i>`;
        const titleEl = document.getElementById('moduleTitle');
        if (titleEl) titleEl.innerHTML = `Модуль ${moduleId}`;
        const descEl = document.getElementById('moduleDesc');
        if (descEl) descEl.innerHTML = moduleNames[moduleId];
        
        const completed = userData.completedLessons?.filter(l => l.startsWith(moduleId)).length || 0;
        const progress = (completed / 14) * 100;
        const progressFill = document.getElementById('moduleProgress');
        if (progressFill) progressFill.style.width = `${progress}%`;
        const progressText = document.getElementById('progressText');
        if (progressText) progressText.innerHTML = `${completed}/14 уроков`;
        
        const titles = lessonTitles[moduleId];
        const container = document.getElementById('lessonsList');
        if (!container) return;
        container.innerHTML = '';
        
        for (let i = 1; i <= 14; i++) {
            const lessonId = `${moduleId}_${i}`;
            const isCompleted = userData.completedLessons?.includes(lessonId);
            const isAvailable = isCompleted || (i === completed + 1);
            
            const div = document.createElement('div');
            div.className = `lesson-card ${!isAvailable ? 'locked' : ''}`;
            div.innerHTML = `
                <div>
                    <div class="lesson-title">Урок ${i}: ${titles[i-1]}</div>
                    <div class="lesson-status">${isCompleted ? 'Пройден' : (isAvailable ? 'Доступен' : 'Заблокирован')}</div>
                </div>
                <i class="fas fa-chevron-right"></i>
            `;
            if (isAvailable) {
                div.onclick = () => window.location.href = `lesson.html?module=${moduleId}&lesson=${i}`;
            }
            container.appendChild(div);
        }
        
        const testBtn = document.getElementById('testBtn');
        if (testBtn) {
            testBtn.onclick = () => {
                window.location.href = `test.html?module=${moduleId}`;
            };
        }
        const backBtn = document.getElementById('backBtn');
        if (backBtn) backBtn.onclick = () => window.location.href = 'dashboard.html';
        
        function updateUI() {
            const energyEl = document.getElementById('energyValue');
            const livesEl = document.getElementById('livesValue');
            const scoreEl = document.getElementById('scoreValue');
            if (energyEl) energyEl.textContent = userData.energy;
            if (livesEl) livesEl.textContent = userData.lives;
            if (scoreEl) scoreEl.textContent = userData.totalScore;
        }
        updateUI();
    });
}

// ============ TEST PAGE ============
if (window.location.pathname.includes('test.html')) {
    onAuthStateChanged(auth, async (user) => {
        if (!user) { window.location.href = 'index.html'; return; }
        currentUser = user;
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        userData = userSnap.data();
        
        const urlParams = new URLSearchParams(window.location.search);
        const moduleId = urlParams.get('module') || 'A1';
        const titleEl = document.getElementById('testTitle');
        if (titleEl) titleEl.innerHTML = `Тест модуля ${moduleId}`;
        
        const questions = testsData[moduleId] || testsData.A1;
        let userAnswers = new Array(questions.length).fill(null);
        let currentIndex = 0;
        
        function loadQuestion(index) {
            const q = questions[index];
            const container = document.getElementById('questionContainer');
            if (!container) return;
            container.innerHTML = `
                <div class="question">
                    <h3>Вопрос ${index + 1} из ${questions.length}</h3>
                    <p>${q.text}</p>
                    <div class="options">
                        ${q.options.map((opt, i) => `
                            <label class="option">
                                <input type="radio" name="answer" value="${i}" ${userAnswers[index] === i ? 'checked' : ''}>
                                ${opt}
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
            const prevBtn = document.getElementById('prevBtn');
            if (prevBtn) prevBtn.disabled = index === 0;
            const answeredCount = userAnswers.filter(a => a !== null).length;
            const correctCountSpan = document.getElementById('correctCount');
            if (correctCountSpan) correctCountSpan.textContent = answeredCount;
            const testProgress = document.getElementById('testProgress');
            if (testProgress) testProgress.style.width = `${((index + 1) / questions.length) * 100}%`;
        }
        
        function saveCurrentAnswer() {
            const selected = document.querySelector('input[name="answer"]:checked');
            if (selected) {
                userAnswers[currentIndex] = parseInt(selected.value);
            }
        }
        
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');
        const submitBtn = document.getElementById('submitBtn');
        
        if (nextBtn) {
            nextBtn.onclick = () => {
                saveCurrentAnswer();
                if (currentIndex < questions.length - 1) {
                    currentIndex++;
                    loadQuestion(currentIndex);
                } else {
                    if (nextBtn) nextBtn.style.display = 'none';
                    if (submitBtn) submitBtn.style.display = 'block';
                }
            };
        }
        
        if (prevBtn) {
            prevBtn.onclick = () => {
                saveCurrentAnswer();
                if (currentIndex > 0) {
                    currentIndex--;
                    loadQuestion(currentIndex);
                }
            };
        }
        
        if (submitBtn) {
            submitBtn.onclick = async () => {
                saveCurrentAnswer();
                let correct = 0;
                for (let i = 0; i < questions.length; i++) {
                    if (userAnswers[i] === questions[i].correct) correct++;
                }
                const percent = (correct / questions.length) * 100;
                const passed = percent >= 70;
                
                const resultDiv = document.getElementById('result');
                if (!resultDiv) return;
                resultDiv.style.display = 'block';
                const testControls = document.querySelector('.test-controls');
                if (testControls) testControls.style.display = 'none';
                const questionContainer = document.getElementById('questionContainer');
                if (questionContainer) questionContainer.style.display = 'none';
                
                if (passed) {
                    const modulesOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'C3'];
                    const currentIdx = modulesOrder.indexOf(moduleId);
                    if (currentIdx + 1 > (userData.modulesUnlocked || 1)) {
                        userData.modulesUnlocked = currentIdx + 2;
                    }
                    userData.totalScore += 50;
                    await saveUserData();
                    playSound('levelup');
                    resultDiv.innerHTML = `
                        <div class="result-success">
                            <i class="fas fa-trophy"></i>
                            <h2>Поздравляем!</h2>
                            <p>Вы набрали ${correct}/${questions.length} (${percent}%)</p>
                            <p>Модуль ${moduleId} пройден! +50 очков</p>
                            <button id="continueBtn" class="btn">Продолжить</button>
                        </div>
                    `;
                    const continueBtn = document.getElementById('continueBtn');
                    if (continueBtn) continueBtn.onclick = () => window.location.href = 'dashboard.html';
                } else {
                    playSound('wrong');
                    resultDiv.innerHTML = `
                        <div class="result-fail">
                            <i class="fas fa-sad-tear"></i>
                            <h2>Нужно подтянуть знания</h2>
                            <p>Вы набрали ${correct}/${questions.length} (${percent}%)</p>
                            <p>Нужно 70% для прохождения</p>
                            <button id="retryBtn" class="btn">Попробовать снова</button>
                        </div>
                    `;
                    const retryBtn = document.getElementById('retryBtn');
                    if (retryBtn) retryBtn.onclick = () => window.location.reload();
                }
            };
        }
        
        loadQuestion(0);
        const backBtn = document.getElementById('backBtn');
        if (backBtn) backBtn.onclick = () => window.location.href = `module.html?module=${moduleId}`;
        
        function updateUI() {
            const scoreEl = document.getElementById('scoreValue');
            if (scoreEl) scoreEl.textContent = userData.totalScore;
        }
        updateUI();
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
        
        const avatarEl = document.getElementById('userAvatar');
        if (avatarEl && user.email) {
            const firstLetter = user.email.charAt(0).toUpperCase();
            avatarEl.textContent = firstLetter;
        }
        
        const rank = getRank(userData.totalScore);
        const rankNameEl = document.getElementById('rankName');
        if (rankNameEl) rankNameEl.textContent = rank.name;
        const totalScoreEl = document.getElementById('totalScore');
        if (totalScoreEl) totalScoreEl.textContent = userData.totalScore;
        const bestScoreEl = document.getElementById('bestScore');
        if (bestScoreEl) bestScoreEl.textContent = userData.totalScore;
        const maxStreakEl = document.getElementById('maxStreak');
        if (maxStreakEl) maxStreakEl.textContent = userData.maxStreak || 0;
        const lessonsCountEl = document.getElementById('lessonsCount');
        if (lessonsCountEl) lessonsCountEl.textContent = userData.completedLessons?.length || 0;
        const goldenCrownsCountEl = document.getElementById('goldenCrownsCount');
        if (goldenCrownsCountEl) goldenCrownsCountEl.textContent = userData.goldenCrowns?.length || 0;
        
        const completed = userData.completedLessons?.length || 0;
        const ach10 = document.getElementById('achLessons10');
        if (ach10) ach10.innerHTML = completed >= 10 ? '✓' : '○';
        const ach25 = document.getElementById('achLessons25');
        if (ach25) ach25.innerHTML = completed >= 25 ? '✓' : '○';
        const ach50 = document.getElementById('achLessons50');
        if (ach50) ach50.innerHTML = completed >= 50 ? '✓' : '○';
        const ach99 = document.getElementById('achLessons99');
        if (ach99) ach99.innerHTML = completed >= 99 ? '✓' : '○';
        const achStreak7 = document.getElementById('achStreak7');
        if (achStreak7) achStreak7.innerHTML = (userData.maxStreak || 0) >= 7 ? '✓' : '○';
        const achStreak30 = document.getElementById('achStreak30');
        if (achStreak30) achStreak30.innerHTML = (userData.maxStreak || 0) >= 30 ? '✓' : '○';
        const achGoldenCrown = document.getElementById('achGoldenCrown');
        if (achGoldenCrown) achGoldenCrown.innerHTML = (userData.goldenCrowns?.length || 0) >= 1 ? '✓' : '○';
        const achMaster = document.getElementById('achMaster');
        if (achMaster) achMaster.innerHTML = userData.totalScore >= 8000 ? '✓' : '○';
        
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.checked = userData.settings?.soundsEnabled !== false;
            soundToggle.onchange = async () => {
                soundEnabled = soundToggle.checked;
                userData.settings = userData.settings || {};
                userData.settings.soundsEnabled = soundEnabled;
                await saveUserData();
            };
        }
        
        const backBtn = document.getElementById('backBtn');
        if (backBtn) backBtn.onclick = () => window.location.href = 'dashboard.html';
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) logoutBtn.onclick = async () => {
            await signOut(auth);
            window.location.href = 'index.html';
        };
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.onclick = async () => {
                if (confirm('Сбросить весь прогресс? Это действие необратимо.')) {
                    const initialData = getInitialUserData();
                    Object.assign(userData, initialData);
                    await saveUserData();
                    alert('Прогресс сброшен');
                    window.location.reload();
                }
            };
        }
        const certBtn = document.getElementById('certBtn');
        if (certBtn) {
            certBtn.onclick = () => {
                if (userData.totalScore >= 8000) {
                    alert('Сертификат:\n\nPyPath\n\nПоздравляем с окончанием курса!');
                } else {
                    alert('Сертификат доступен после достижения 8000 очков');
                }
            };
        }
        
        function updateUI() {
            const scoreEl = document.getElementById('scoreValue');
            if (scoreEl) scoreEl.textContent = userData.totalScore;
            const bestScoreValueEl = document.getElementById('bestScoreValue');
            if (bestScoreValueEl) bestScoreValueEl.textContent = userData.totalScore;
        }
        updateUI();
    });
}