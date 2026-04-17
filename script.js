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
        msgDiv.textContent = text;
        msgDiv.className = `message-area ${type}`;
        setTimeout(() => {
            msgDiv.textContent = '';
            msgDiv.className = 'message-area';
        }, 3000);
    }
}

async function saveUserData() {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    await setDoc(userRef, userData, { merge: true });
}

// ============ ФУНКЦИЯ ОБНОВЛЕНИЯ UI (ПЕРЕНЕСЕНА ВВЕРХ) ============
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

// ============ ТЕСТЫ (ПОЛНЫЕ, 15 ВОПРОСОВ ДЛЯ КАЖДОГО МОДУЛЯ) ============
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

// ============ ТЕОРИЯ ДЛЯ ВСЕХ УРОКОВ ============
function getTheory(moduleId, lessonNum) {
    const theories = {
        A1_1: 'Переменная — это именованный контейнер для данных. В Python переменная создаётся присваиванием: <code>x = 5</code>. Имя переменной должно начинаться с буквы или подчёркивания.',
        A1_2: 'Типы данных: <code>int</code> (целые), <code>float</code> (дробные), <code>str</code> (строки), <code>bool</code> (True/False).',
        A1_3: 'Функция <code>print()</code> выводит текст на экран.',
        A1_4: 'Функция <code>input()</code> читает строку с клавиатуры. Всегда возвращает <code>str</code>.',
        A1_5: 'Приведение типов: <code>int()</code>, <code>str()</code>, <code>float()</code>.',
        A1_6: 'Арифметика: <code>+ - * / // % **</code>',
        A1_7: 'Строки можно складывать, умножать, брать срезы.',
        A1_8: 'f-строки: <code>f"Привет, {name}"</code>',
        A1_9: 'Булевы значения: <code>True</code> и <code>False</code>.',
        A1_10: 'Условный оператор <code>if</code> проверяет условие.',
        A1_11: 'Практика: ввод и вывод данных.',
        A1_12: 'Практика: арифметика и переменные.',
        A1_13: 'Практика: обмен значений переменных.',
        A1_14: 'Повторение модуля A1.',
        A2_1: 'if проверяет условие. Если True — выполняет блок.',
        A2_2: 'else выполняется, если условие if ложно.',
        A2_3: 'elif позволяет проверить несколько условий.',
        A2_4: 'Логические операторы: and, or, not.',
        A2_5: 'Вложенные условия — if внутри if.',
        A2_6: 'Тернарный оператор: x if условие else y',
        A2_7: 'Сравнение строк происходит посимвольно.',
        A2_8: 'Сравнение чисел — стандартное.',
        A2_9: 'Логические цепочки: if x > 5 and x < 10',
        A2_10: 'Практика: if-elif-else',
        A2_11: 'Практика: логические операторы',
        A2_12: 'Практика: вложенные условия',
        A2_13: 'Практика: тернарный оператор',
        A2_14: 'Повторение модуля A2',
        B1_1: 'for i in range(n): — повторяет код n раз',
        B1_2: 'range(start, stop, step) — последовательность',
        B1_3: 'while условие: — выполняется пока условие True',
        B1_4: 'break — прерывает цикл',
        B1_5: 'continue — пропускает итерацию',
        B1_6: 'else в цикле — выполняется если не было break',
        B1_7: 'Вложенные циклы — цикл внутри цикла',
        B1_8: 'Бесконечный цикл — while True:',
        B1_9: 'enumerate — индекс и значение',
        B1_10: 'Практика: for и range',
        B1_11: 'Практика: while',
        B1_12: 'Практика: break и continue',
        B1_13: 'Практика: вложенные циклы',
        B1_14: 'Повторение модуля B1',
        B2_1: 'def имя(): — создаёт функцию',
        B2_2: 'Аргументы — данные для функции',
        B2_3: 'return — возвращает значение',
        B2_4: 'None — отсутствие значения',
        B2_5: 'Область видимости — где доступна переменная',
        B2_6: '*args — много аргументов',
        B2_7: '**kwargs — именованные аргументы',
        B2_8: 'lambda — анонимная функция',
        B2_9: 'map() — применяет функцию к списку',
        B2_10: 'filter() — фильтрует список',
        B2_11: 'Рекурсия — функция вызывает себя',
        B2_12: 'Docstring — документация функции',
        B2_13: 'Практика: создание функций',
        B2_14: 'Повторение модуля B2',
        C1_1: 'Список — [1, 2, 3]',
        C1_2: 'Методы списков: append, insert, remove, pop',
        C1_3: 'Срезы: [начало:конец:шаг]',
        C1_4: 'Словарь — {"ключ": "значение"}',
        C1_5: 'Методы словарей: keys, values, items',
        C1_6: 'Множество — уникальные элементы {1,2,3}',
        C1_7: 'Кортеж — неизменяемый список (1,2,3)',
        C1_8: 'list comprehension — [x*2 for x in range(5)]',
        C1_9: 'dict comprehension — {x: x*2 for x in range(5)}',
        C1_10: 'Распаковка: a, b = [1, 2]',
        C1_11: 'Копирование: copy(), deepcopy()',
        C1_12: 'Практика: списки',
        C1_13: 'Практика: словари',
        C1_14: 'Повторение модуля C1',
        C2_1: 'enumerate — индекс и значение',
        C2_2: 'zip — объединяет последовательности',
        C2_3: 'sorted — сортировка',
        C2_4: 'any — True если есть True',
        C2_5: 'all — True если все True',
        C2_6: 'try/except — обработка ошибок',
        C2_7: 'open() — открытие файла',
        C2_8: 'read() — чтение файла',
        C2_9: 'write() — запись в файл',
        C2_10: 'import — подключение модулей',
        C2_11: 'datetime — дата и время',
        C2_12: 'random — случайные числа',
        C2_13: 'Практика: try/except',
        C2_14: 'Практика: файлы',
        C3_1: 'class — шаблон для объектов',
        C3_2: 'self — ссылка на объект',
        C3_3: '__init__ — конструктор',
        C3_4: 'Наследование — class Child(Parent)',
        C3_5: '__str__, __repr__, __len__ — магические методы',
        C3_6: '@property — управление доступом',
        C3_7: '@staticmethod — статический метод',
        C3_8: 'raise — выброс исключения',
        C3_9: 'Практика: классы',
        C3_10: 'Практика: наследование',
        C3_11: 'Практика: магические методы',
        C3_12: 'Практика: property',
        C3_13: 'Практика: статические методы',
        C3_14: 'Повторение всего курса'
    };
    const key = `${moduleId}_${lessonNum}`;
    return theories[key] || `Изучите тему "${lessonTitles[moduleId]?.[lessonNum-1] || 'Урок'}" и выполните задание.`;
}

// ============ ЗАДАНИЯ ДЛЯ ВСЕХ УРОКОВ ============
function getTask(moduleId, lessonNum) {
    const tasks = {
        A1_1: { type: 'code', description: 'Создайте переменную name со значением "Анна" и выведите её.', validator: (c) => c.includes('name') && c.includes('print') },
        A1_2: { type: 'fill', code: 'x = ___\nprint(type(x))', correct: '5' },
        A1_3: { type: 'code', description: 'Напишите код, который выводит "Привет, мир!"', validator: (c) => c.includes('print') && (c.includes('"Привет, мир!"') || c.includes("'Привет, мир!'")) },
        A1_4: { type: 'code', description: 'Напишите код, который запрашивает имя и выводит "Привет, [имя]!"', validator: (c) => c.includes('input') && c.includes('print') },
        A1_5: { type: 'fill', code: 'x = "5"\ny = ___\nprint(y + 3)', correct: 'int(x)' },
        A1_6: { type: 'code', description: 'Вычислите 5 в 3 степени', validator: (c) => c.includes('5**3') || c.includes('pow(5,3)') },
        A1_7: { type: 'fill', code: 'name = "Анна"\nprint(name[___])', correct: '1' },
        A1_8: { type: 'code', description: 'Создайте name="Анна" и выведите f"Привет, {name}"', validator: (c) => c.includes('f"') || c.includes("f'") },
        A1_9: { type: 'explain', question: 'Что вернёт 5 == 5?', options: ['True', 'False', 'Ошибку'], correct: 0 },
        A1_10: { type: 'puzzle', code: ['x = 10', 'if x > 5:', 'print("Больше")'] },
        A1_11: { type: 'code', description: 'Запросите имя и выведите приветствие', validator: (c) => c.includes('input') && c.includes('print') },
        A1_12: { type: 'fill', code: 'a = 5\nb = 3\ns = ___\nprint(s)', correct: 'a * b' },
        A1_13: { type: 'code', description: 'Поменяйте местами a и b', validator: (c) => c.includes('a, b = b, a') || (c.includes('temp') && c.includes('a') && c.includes('b')) },
        A1_14: { type: 'checkbox', question: 'Какие типы данных есть в Python?', options: ['int', 'str', 'float', 'char'], correct: [0,1,2] },
        
        A2_1: { type: 'code', description: 'Напишите if, который проверяет, что x > 5 и выводит "Больше"', validator: (c) => c.includes('if') && c.includes('x > 5') },
        A2_2: { type: 'fill', code: 'x = 3\nif x > 5:\n    print("A")\n___:\n    print("B")', correct: 'else' },
        A2_3: { type: 'explain', question: 'Что выведет при x=75?', options: ['5', '4', '3'], correct: 1 },
        A2_4: { type: 'checkbox', question: 'Какие логические операторы есть в Python?', options: ['and', 'or', 'not', 'xor'], correct: [0,1,2] },
        A2_5: { type: 'code', description: 'Напишите if, который проверяет age >= 18', validator: (c) => c.includes('if') && c.includes('age') },
        A2_6: { type: 'fill', code: 'x = 10\nresult = "A" if x > 5 ___ "B"', correct: 'else' },
        A2_7: { type: 'code', description: 'Сравните две строки "abc" и "abd"', validator: (c) => c.includes('"abc"') && c.includes('"abd"') },
        A2_8: { type: 'fill', code: 'if x ___ 5:\n    print("x равно 5")', correct: '==' },
        A2_9: { type: 'code', description: 'Проверьте, что x между 5 и 10', validator: (c) => c.includes('x > 5') && c.includes('x < 10') },
        A2_10: { type: 'code', description: 'Напишите программу с if-elif-else для оценки (90→A, 70→B, иначе C)', validator: (c) => c.includes('if') && c.includes('elif') && c.includes('else') },
        A2_11: { type: 'code', description: 'Используйте and для проверки возраста и прав', validator: (c) => c.includes('and') },
        A2_12: { type: 'code', description: 'Вложенный if: проверьте, что x > 0 и x < 10', validator: (c) => c.includes('if') && c.includes('and') },
        A2_13: { type: 'fill', code: 'x = 5\nresult = "Positive" if x > 0 ___ "Negative"', correct: 'else' },
        A2_14: { type: 'checkbox', question: 'Что делает elif?', options: ['Проверяет доп. условие', 'Завершает программу', 'Повторяет код'], correct: [0] },
        
        B1_1: { type: 'code', description: 'Напишите цикл for, который выводит числа от 0 до 4', validator: (c) => c.includes('for') && c.includes('range') },
        B1_2: { type: 'fill', code: 'for i in range(___):\n    print(i)', correct: '5' },
        B1_3: { type: 'code', description: 'Напишите цикл while, который выводит 0,1,2', validator: (c) => c.includes('while') },
        B1_4: { type: 'code', description: 'Напишите цикл с break при i == 3', validator: (c) => c.includes('break') },
        B1_5: { type: 'code', description: 'Напишите цикл с continue для пропуска чётных чисел', validator: (c) => c.includes('continue') },
        B1_6: { type: 'code', description: 'Напишите цикл с else, который выполняется после завершения', validator: (c) => c.includes('else') },
        B1_7: { type: 'code', description: 'Напишите вложенный цикл для таблицы умножения', validator: (c) => c.includes('for') && c.includes('for') },
        B1_8: { type: 'fill', code: 'while ___:\n    print("бесконечно")', correct: 'True' },
        B1_9: { type: 'code', description: 'Используйте enumerate для вывода индекса и значения', validator: (c) => c.includes('enumerate') },
        B1_10: { type: 'code', description: 'Суммируйте числа от 1 до 100 через for', validator: (c) => c.includes('for') && c.includes('range') },
        B1_11: { type: 'code', description: 'Найдите первое число больше 50 в списке, используя break', validator: (c) => c.includes('break') },
        B1_12: { type: 'code', description: 'Напишите вложенный цикл для вывода координат', validator: (c) => c.includes('for') && c.includes('for') },
        B1_13: { type: 'fill', code: 'for i, val in enumerate([10,20,30]):\n    print(i, ___)', correct: 'val' },
        B1_14: { type: 'checkbox', question: 'Что делает break?', options: ['Прерывает цикл', 'Пропускает итерацию', 'Завершает программу'], correct: [0] },
        
        B2_1: { type: 'code', description: 'Создайте функцию say_hello, которая выводит "Hello"', validator: (c) => c.includes('def') && c.includes('say_hello') },
        B2_2: { type: 'code', description: 'Создайте функцию add(a,b), которая возвращает сумму', validator: (c) => c.includes('return') },
        B2_3: { type: 'fill', code: 'def add(a,b):\n    ___ a + b', correct: 'return' },
        B2_4: { type: 'explain', question: 'Что вернёт функция без return?', options: ['None', '0', 'Ошибку'], correct: 0 },
        B2_5: { type: 'code', description: 'Создайте функцию, которая меняет глобальную переменную', validator: (c) => c.includes('global') },
        B2_6: { type: 'code', description: 'Создайте функцию с *args, суммирующую все аргументы', validator: (c) => c.includes('*args') },
        B2_7: { type: 'code', description: 'Создайте функцию с **kwargs, выводящую их', validator: (c) => c.includes('**kwargs') },
        B2_8: { type: 'code', description: 'Создайте lambda, удваивающую число', validator: (c) => c.includes('lambda') },
        B2_9: { type: 'code', description: 'Используйте map для удвоения элементов списка', validator: (c) => c.includes('map') && c.includes('lambda') },
        B2_10: { type: 'code', description: 'Используйте filter для чётных чисел', validator: (c) => c.includes('filter') && c.includes('lambda') },
        B2_11: { type: 'code', description: 'Напишите рекурсивную функцию факториала', validator: (c) => c.includes('def') && c.includes('return') && c.includes('factorial') },
        B2_12: { type: 'code', description: 'Добавьте docstring к функции', validator: (c) => c.includes('"""') },
        B2_13: { type: 'code', description: 'Создайте функцию с аргументом по умолчанию', validator: (c) => c.includes('=') && c.includes('def') },
        B2_14: { type: 'checkbox', question: 'Что делает return?', options: ['Возвращает значение', 'Выводит значение', 'Завершает функцию'], correct: [0] },
        
        C1_1: { type: 'code', description: 'Создайте список из 5 чисел', validator: (c) => c.includes('[') && c.includes(']') },
        C1_2: { type: 'code', description: 'Добавьте элемент в список через append', validator: (c) => c.includes('append') },
        C1_3: { type: 'fill', code: 'nums = [1,2,3,4,5]\nprint(nums[___])  # выведет 3', correct: '2' },
        C1_4: { type: 'code', description: 'Создайте словарь с ключами "name" и "age"', validator: (c) => c.includes('{') && c.includes('}') && c.includes(':') },
        C1_5: { type: 'code', description: 'Получите значение по ключу из словаря', validator: (c) => c.includes('[') && c.includes(']') },
        C1_6: { type: 'code', description: 'Создайте множество из чисел 1,2,3', validator: (c) => c.includes('{') && c.includes('}') && !c.includes(':') },
        C1_7: { type: 'code', description: 'Создайте кортеж из трёх элементов', validator: (c) => c.includes('(') && c.includes(')') },
        C1_8: { type: 'code', description: 'Создайте список квадратов чисел от 1 до 5 через list comprehension', validator: (c) => c.includes('for') && c.includes(']') },
        C1_9: { type: 'code', description: 'Создайте словарь квадратов чисел от 1 до 5', validator: (c) => c.includes('for') && c.includes(':') },
        C1_10: { type: 'code', description: 'Распакуйте список [1,2] в переменные a,b', validator: (c) => c.includes('=') && c.includes(',') },
        C1_11: { type: 'code', description: 'Скопируйте список через copy()', validator: (c) => c.includes('copy') },
        C1_12: { type: 'code', description: 'Найдите сумму всех элементов списка', validator: (c) => c.includes('sum') },
        C1_13: { type: 'code', description: 'Отсортируйте список', validator: (c) => c.includes('sorted') || c.includes('.sort()') },
        C1_14: { type: 'checkbox', question: 'Как создать список?', options: ['[]', '{}', '()'], correct: [0] },
        
        C2_1: { type: 'code', description: 'Используйте enumerate для вывода индекса и значения', validator: (c) => c.includes('enumerate') },
        C2_2: { type: 'code', description: 'Объедините два списка через zip', validator: (c) => c.includes('zip') },
        C2_3: { type: 'code', description: 'Отсортируйте список через sorted', validator: (c) => c.includes('sorted') },
        C2_4: { type: 'code', description: 'Проверьте, есть ли True в списке через any', validator: (c) => c.includes('any') },
        C2_5: { type: 'code', description: 'Проверьте, все ли элементы True через all', validator: (c) => c.includes('all') },
        C2_6: { type: 'code', description: 'Напишите try/except для деления на ноль', validator: (c) => c.includes('try') && c.includes('except') },
        C2_7: { type: 'code', description: 'Откройте файл для чтения', validator: (c) => c.includes('open') && c.includes('"r"') },
        C2_8: { type: 'code', description: 'Прочитайте содержимое файла', validator: (c) => c.includes('.read()') },
        C2_9: { type: 'code', description: 'Запишите строку в файл', validator: (c) => c.includes('.write') && c.includes('"w"') },
        C2_10: { type: 'code', description: 'Импортируйте модуль math', validator: (c) => c.includes('import math') },
        C2_11: { type: 'code', description: 'Выведите текущую дату', validator: (c) => c.includes('datetime') },
        C2_12: { type: 'code', description: 'Сгенерируйте случайное число от 1 до 10', validator: (c) => c.includes('random') },
        C2_13: { type: 'code', description: 'Напишите try-except-else', validator: (c) => c.includes('else') && c.includes('except') },
        C2_14: { type: 'checkbox', question: 'Что делает try/except?', options: ['Обрабатывает ошибки', 'Создаёт цикл', 'Определяет функцию'], correct: [0] },
        
        C3_1: { type: 'code', description: 'Создайте класс Car', validator: (c) => c.includes('class') },
        C3_2: { type: 'code', description: 'Создайте метод __init__ в классе', validator: (c) => c.includes('__init__') },
        C3_3: { type: 'code', description: 'Создайте метод с self', validator: (c) => c.includes('self') && c.includes('def') },
        C3_4: { type: 'code', description: 'Создайте класс ElectricCar, наследующий от Car', validator: (c) => c.includes('class') && c.includes('(') },
        C3_5: { type: 'code', description: 'Добавьте метод __str__ в класс', validator: (c) => c.includes('__str__') },
        C3_6: { type: 'code', description: 'Добавьте property в класс', validator: (c) => c.includes('@property') },
        C3_7: { type: 'code', description: 'Добавьте статический метод @staticmethod', validator: (c) => c.includes('@staticmethod') },
        C3_8: { type: 'code', description: 'Вызовите исключение через raise', validator: (c) => c.includes('raise') },
        C3_9: { type: 'code', description: 'Создайте класс BankAccount с балансом', validator: (c) => c.includes('class') && c.includes('balance') },
        C3_10: { type: 'code', description: 'Создайте объект класса', validator: (c) => c.includes('=') && c.includes('(') },
        C3_11: { type: 'code', description: 'Переопределите метод родителя', validator: (c) => c.includes('super()') },
        C3_12: { type: 'code', description: 'Добавьте __len__ в класс', validator: (c) => c.includes('__len__') },
        C3_13: { type: 'code', description: 'Создайте класс с @classmethod', validator: (c) => c.includes('@classmethod') },
        C3_14: { type: 'checkbox', question: 'Что такое класс?', options: ['Шаблон для объектов', 'Функция', 'Переменная'], correct: [0] }
    };
    const key = `${moduleId}_${lessonNum}`;
    return tasks[key] || { type: 'code', description: 'Напишите код, который выводит "Hello, World!"', validator: (code) => code.includes('print') };
}

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
        
        // Проверка стрейка
        if (lastLoginDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastLoginDate === yesterday.toDateString()) {
                userData.streak = (userData.streak || 0) + 1;
                userData.maxStreak = Math.max(userData.maxStreak, userData.streak);
                showMessage(`🔥 Стрейк: ${userData.streak} дней!`, 'success');
            } else if (lastLoginDate !== yesterday.toDateString() && lastLoginDate !== today) {
                userData.streak = 1;
            }
            userData.lastLogin = Date.now();
            userData.totalScore += 50;
            showMessage(`Ежедневный бонус: +50 очков!`, 'success');
            playSound('reward');
            await saveUserData();
        }
        
        // Обновление ежедневных заданий
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
        document.getElementById('logoutBtn').onclick = async () => {
            await signOut(auth);
            window.location.href = 'index.html';
        };
        document.getElementById('continueBtn').onclick = () => {
            const next = findNextLesson();
            window.location.href = `lesson.html?module=${next.module}&lesson=${next.id}`;
        };
        document.getElementById('buyEnergyBtn').onclick = async () => {
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
        document.getElementById('buyLifeBtn').onclick = async () => {
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

// ============ LESSON PAGE ============
if (window.location.pathname.includes('lesson.html')) {
    let hintUsed = false;
    let correctStreak = 0;
    let currentPuzzleOrder = [];
    
    onAuthStateChanged(auth, async (user) => {
        if (!user) { window.location.href = 'index.html'; return; }
        currentUser = user;
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        userData = userSnap.data();
        
        const urlParams = new URLSearchParams(window.location.search);
        const moduleId = urlParams.get('module');
        const lessonNum = parseInt(urlParams.get('lesson'));
        const lessonId = `${moduleId}_${lessonNum}`;
        const isCompleted = userData.completedLessons?.includes(lessonId);
        
        const titles = lessonTitles[moduleId];
        const titleEl = document.getElementById('lessonTitle');
        if (titleEl) titleEl.innerHTML = `Урок ${lessonNum}: ${titles[lessonNum-1]}`;
        
        const theory = getTheory(moduleId, lessonNum);
        const theoryEl = document.getElementById('theoryContent');
        if (theoryEl) theoryEl.innerHTML = theory;
        
        const task = getTask(moduleId, lessonNum);
        setupTask(task);
        
        if (!isCompleted && !userData.completedLessons?.includes(lessonId)) {
            if (userData.energy < 1) {
                showMessage('Недостаточно энергии!', 'error');
                setTimeout(() => window.location.href = 'dashboard.html', 1500);
                return;
            }
            userData.energy -= 1;
            userData.stats.totalEnergyUsed = (userData.stats.totalEnergyUsed || 0) + 1;
            await saveUserData();
            updateUI();
        }
        
        const backBtn = document.getElementById('backBtn');
        if (backBtn) backBtn.onclick = () => window.location.href = `module.html?module=${moduleId}`;
        
        function setupTask(task) {
            const container = document.getElementById('taskContainer');
            if (!container) return;
            container.innerHTML = '';
            
            if (task.type === 'code') {
                container.innerHTML = `
                    <p>${task.description}</p>
                    <textarea id="codeAnswer" rows="6" placeholder="Напишите код здесь..."></textarea>
                    <button id="checkBtn" class="btn-check">Проверить</button>
                `;
                const checkBtn = document.getElementById('checkBtn');
                if (checkBtn) checkBtn.onclick = () => checkCode(task.validator);
            } else if (task.type === 'fill') {
                container.innerHTML = `
                    <pre>${task.code}</pre>
                    <input type="text" id="fillAnswer" placeholder="Вставьте пропущенное">
                    <button id="checkBtn" class="btn-check">Проверить</button>
                `;
                const checkBtn = document.getElementById('checkBtn');
                if (checkBtn) checkBtn.onclick = () => checkFill(task.correct);
            } else if (task.type === 'explain') {
                container.innerHTML = `
                    <p>${task.question}</p>
                    <div id="explainOptions"></div>
                    <button id="checkBtn" class="btn-check">Проверить</button>
                `;
                const optionsDiv = document.getElementById('explainOptions');
                task.options.forEach((opt, idx) => {
                    const label = document.createElement('label');
                    label.innerHTML = `<input type="radio" name="explain" value="${idx}"> ${opt}`;
                    optionsDiv.appendChild(label);
                });
                const checkBtn = document.getElementById('checkBtn');
                if (checkBtn) checkBtn.onclick = () => checkExplain(task.correct);
            } else if (task.type === 'checkbox') {
                container.innerHTML = `
                    <p>${task.question}</p>
                    <div id="checkboxOptions"></div>
                    <button id="checkBtn" class="btn-check">Проверить</button>
                `;
                const optionsDiv = document.getElementById('checkboxOptions');
                task.options.forEach((opt, idx) => {
                    const label = document.createElement('label');
                    label.innerHTML = `<input type="checkbox" value="${idx}"> ${opt}`;
                    optionsDiv.appendChild(label);
                });
                const checkBtn = document.getElementById('checkBtn');
                if (checkBtn) checkBtn.onclick = () => checkCheckbox(task.correct);
            } else if (task.type === 'puzzle') {
                container.innerHTML = `
                    <p>Соберите код в правильном порядке (перетащите карточки):</p>
                    <div id="puzzleContainer"></div>
                    <button id="checkBtn" class="btn-check">Проверить</button>
                `;
                setupPuzzle(task.code);
                const checkBtn = document.getElementById('checkBtn');
                if (checkBtn) checkBtn.onclick = () => checkPuzzle(task.code);
            }
        }
        
        function setupPuzzle(correctCode) {
            const container = document.getElementById('puzzleContainer');
            if (!container) return;
            currentPuzzleOrder = [...correctCode];
            for (let i = currentPuzzleOrder.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [currentPuzzleOrder[i], currentPuzzleOrder[j]] = [currentPuzzleOrder[j], currentPuzzleOrder[i]];
            }
            renderPuzzle();
        }
        
        function renderPuzzle() {
            const container = document.getElementById('puzzleContainer');
            if (!container) return;
            container.innerHTML = '';
            currentPuzzleOrder.forEach((piece, idx) => {
                const div = document.createElement('div');
                div.className = 'puzzle-piece';
                div.textContent = piece;
                div.draggable = true;
                div.setAttribute('data-index', idx);
                div.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', idx);
                });
                div.addEventListener('dragover', (e) => e.preventDefault());
                div.addEventListener('drop', (e) => {
                    e.preventDefault();
                    const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
                    const toIdx = idx;
                    if (fromIdx !== toIdx) {
                        [currentPuzzleOrder[fromIdx], currentPuzzleOrder[toIdx]] = [currentPuzzleOrder[toIdx], currentPuzzleOrder[fromIdx]];
                        renderPuzzle();
                    }
                });
                container.appendChild(div);
            });
        }
        
        function checkPuzzle(correctCode) {
            const isCorrect = currentPuzzleOrder.join('') === correctCode.join('');
            if (isCorrect) {
                completeLesson();
            } else {
                handleWrong();
            }
        }
        
        async function completeLesson() {
            if (userData.completedLessons?.includes(lessonId)) {
                showMessage('Урок уже пройден!', 'info');
                setTimeout(() => window.location.href = `module.html?module=${moduleId}`, 1500);
                return;
            }
            
            userData.completedLessons = userData.completedLessons || [];
            userData.completedLessons.push(lessonId);
            userData.totalScore += 30;
            userData.lives = Math.min(5, userData.lives + 1);
            userData.stats.totalLessonsCompleted = (userData.stats.totalLessonsCompleted || 0) + 1;
            
            if (userData.dailyQuests) {
                const quest1 = userData.dailyQuests.quests.find(q => q.id === 1);
                if (quest1 && !quest1.completed) {
                    quest1.progress++;
                    if (quest1.progress >= quest1.target) {
                        quest1.completed = true;
                        userData.totalScore += quest1.reward;
                        showMessage(`Задание выполнено: +${quest1.reward} очков!`, 'success');
                    }
                }
                const quest2 = userData.dailyQuests.quests.find(q => q.id === 2);
                if (quest2 && !quest2.completed) {
                    correctStreak++;
                    quest2.progress = correctStreak;
                    if (correctStreak >= quest2.target) {
                        quest2.completed = true;
                        userData.energy = Math.min(5, userData.energy + 1);
                        showMessage(`Задание выполнено: +1 энергия!`, 'success');
                    }
                }
            }
            
            if (!hintUsed && !userData.goldenCrowns?.includes(lessonId)) {
                userData.goldenCrowns = userData.goldenCrowns || [];
                userData.goldenCrowns.push(lessonId);
                userData.stats.perfectLessons = (userData.stats.perfectLessons || 0) + 1;
                showMessage('Золотая корона! Идеальное прохождение!', 'success');
                playSound('levelup');
            }
            
            await saveUserData();
            playSound('correct');
            showMessage('Правильно! +30 очков, +1 жизнь', 'success');
            setTimeout(() => window.location.href = `module.html?module=${moduleId}`, 2000);
        }
        
        async function handleWrong() {
            playSound('wrong');
            userData.lives = Math.max(0, userData.lives - 1);
            userData.stats.totalLivesLost = (userData.stats.totalLivesLost || 0) + 1;
            correctStreak = 0;
            await saveUserData();
            updateUI();
            
            if (userData.lives <= 0) {
                showMessage('Жизни кончились! Возврат на главную...', 'error');
                setTimeout(() => window.location.href = 'dashboard.html', 2000);
            } else {
                showMessage(`Неправильно! Осталось ${userData.lives} жизней.`, 'error');
            }
        }
        
        function checkCode(validator) {
            const code = document.getElementById('codeAnswer')?.value || '';
            if (validator(code)) {
                completeLesson();
            } else {
                handleWrong();
            }
        }
        
        function checkFill(correct) {
            const answer = document.getElementById('fillAnswer')?.value.trim() || '';
            if (answer === correct) {
                completeLesson();
            } else {
                handleWrong();
            }
        }
        
        function checkExplain(correct) {
            const selected = document.querySelector('input[name="explain"]:checked');
            if (!selected) {
                showMessage('Выберите ответ', 'error');
                return;
            }
            if (parseInt(selected.value) === correct) {
                completeLesson();
            } else {
                handleWrong();
            }
        }
        
        function checkCheckbox(correct) {
            const selected = Array.from(document.querySelectorAll('#checkboxOptions input:checked')).map(cb => parseInt(cb.value));
            const isCorrect = selected.length === correct.length && correct.every(v => selected.includes(v));
            if (isCorrect) {
                completeLesson();
            } else {
                handleWrong();
            }
        }
        
        function updateUI() {
            const energyEl = document.getElementById('energyValue');
            const livesEl = document.getElementById('livesValue');
            const scoreEl = document.getElementById('scoreValue');
            if (energyEl) energyEl.textContent = userData.energy;
            if (livesEl) livesEl.textContent = userData.lives;
            if (scoreEl) scoreEl.textContent = userData.totalScore;
        }
        updateUI();
        
        // Подсказка
        const hintBtn = document.getElementById('hintBtn');
        if (hintBtn) {
            hintBtn.onclick = async () => {
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
                await saveUserData();
                updateUI();
                playSound('reward');
                
                if (task.type === 'puzzle') {
                    showMessage(`Подсказка: первый элемент должен быть: ${task.code[0]}`, 'info');
                } else if (task.type === 'fill') {
                    showMessage(`Подсказка: правильный ответ: ${task.correct}`, 'info');
                } else if (task.type === 'explain') {
                    showMessage(`Подсказка: правильный ответ: ${task.options[task.correct]}`, 'info');
                } else {
                    showMessage('Подсказка: внимательно прочитайте теорию', 'info');
                }
            };
        }
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
        
        // Аватар из первой буквы email
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