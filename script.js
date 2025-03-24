import words from './data.js';

let currentLang = localStorage.getItem('language') || "en";
let currentTheme = null;
let currentWordIndex = 0;
let shuffledWords = [];
let selectedOption = null;
let isIncorrectSelected = false;
let mistakes = new Set();
let correctAnswers = 0;
let totalWords = 0;
let isResultsShown = false;

const urlParams = new URLSearchParams(window.location.search);
const groupIndex = urlParams.get('group'); // Теперь строка, а не parseInt
const isAll = urlParams.get('all') === 'true';
const isMistakes = urlParams.get('mistakes') === 'true';

// Инициализация слов для теста
function initializeWords() {
    if (isMistakes) {
        const sessionMistakes = JSON.parse(localStorage.getItem('currentSessionMistakes') || '[]');
        console.log('Загруженные ошибки из localStorage:', sessionMistakes);
        shuffledWords = sessionMistakes.length > 0 ? sessionMistakes.sort(() => Math.random() - 0.5) : [];
        if (shuffledWords.length === 0) {
            console.log('Нет ошибок для отработки, переходим к результатам');
            showResults();
            return false;
        }
    } else if (isAll) {
        // Исключаем слова из группы "my-mistakes"
        shuffledWords = [...words]
            .filter(word => word.group !== "my-mistakes")
            .sort(() => Math.random() - 0.5);
    } else if (groupIndex === "my-mistakes") {
        // Загружаем только слова из группы "my-mistakes"
        shuffledWords = [...words]
            .filter(word => word.group === "my-mistakes")
            .sort(() => Math.random() - 0.5);
    } else {
        // Для групп 1-7
        shuffledWords = [...words]
            .filter(word => word.group === (parseInt(groupIndex) + 1))
            .sort(() => Math.random() - 0.5);
    }

    totalWords = shuffledWords.length;
    console.log('Инициализированные слова:', shuffledWords);
    return true;
}

const testContainer = document.querySelector(".container");
const questionWord = document.getElementById("word");
const progress = document.getElementById("counter");
const groupDisplay = document.getElementById("groupDisplay");
const optionsDiv = document.getElementById("options");
const stopBtn = document.getElementById("stopBtn");
const dontKnowBtn = document.getElementById("nextBtn");
const speakBtn = document.getElementById("speakBtn");
const resultsDiv = document.getElementById("mistakesTable");
const mistakesTableBody = document.getElementById("mistakesBody");
const backBtn = document.getElementById("backBtn");
const workOnMistakesBtn = document.getElementById("workOnMistakesBtn");
const title = document.querySelector("h1");
const testResultsDiv = document.getElementById("testResults");

if (!questionWord) console.error('Элемент с id="word" не найден!');
if (!optionsDiv) console.error('Элемент с id="options" не найден!');
if (!progress) console.error('Элемент с id="counter" не найден!');
if (!groupDisplay) console.error('Элемент с id="groupDisplay" не найден!');
if (!workOnMistakesBtn) {
    console.error('Кнопка "Work on Mistakes" не найдена в DOM!');
} else {
    console.log('Кнопка "Work on Mistakes" найдена, привязываем обработчик');
}

document.querySelectorAll(".language-btn").forEach(btn => {
    if (btn.dataset.lang === currentLang) {
        btn.classList.add("active", "btn-success");
    } else {
        btn.classList.add("btn-secondary");
    }
});

document.querySelectorAll(".language-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".language-btn.active").classList.remove("active", "btn-success");
        btn.classList.add("active", "btn-success");
        document.querySelectorAll(".language-btn").forEach(otherBtn => {
            if (otherBtn !== btn) otherBtn.classList.add("btn-secondary");
        });
        currentLang = btn.dataset.lang;
        localStorage.setItem('language', currentLang);
        updateLanguageButtons();
        updateButtonText();
        updateTitle();
        updateTableHeaders();
        if (resultsDiv.classList.contains("d-none")) {
            loadQuestion();
        } else {
            updateResultsText();
        }
    });
});

function updateTitle() {
    const titles = {
        ru: "Изучаю слова для программирования",
        en: "Studying Programming Words"
    };
    title.textContent = titles[currentLang];
}

function updateTableHeaders() {
    const headers = document.querySelectorAll("#mistakesTable th");
    headers.forEach(header => {
        header.textContent = {
            ru: header.getAttribute("data-text-ru"),
            en: header.getAttribute("data-text-en")
        }[currentLang];
    });
    document.getElementById("mistakesTitle").textContent = {
        ru: "Список ошибок",
        en: "List of Mistakes"
    }[currentLang];
}

function updateResultsText() {
    const mistakeWords = Array.from(mistakes).map(m => JSON.parse(m));
    const errors = mistakeWords.length;
    correctAnswers = totalWords - errors;

    if (mistakeWords.length === 0) {
        testResultsDiv.textContent = currentLang === "ru" ? "Нет ошибок!" : "No mistakes!";
    } else {
        testResultsDiv.innerHTML = currentLang === "ru"
            ? `<span>Правильно: ${correctAnswers}</span><span>Ошибок: ${errors}</span><span>Всего слов: ${totalWords}</span>`
            : `<span>Correct: ${correctAnswers}</span><span>Mistakes: ${errors}</span><span>Total Words: ${totalWords}</span>`;
    }
}

function updateLanguageButtons() {
    document.querySelectorAll(".language-btn").forEach(btn => {
        if (btn.dataset.lang === currentLang) {
            btn.classList.remove("btn-secondary");
            btn.classList.add("btn-success");
        } else {
            btn.classList.remove("btn-success");
            btn.classList.add("btn-secondary");
        }
    });
}

function updateButtonText() {
    stopBtn.textContent = {
        ru: "Стоп",
        en: "Stop"
    }[currentLang];
    dontKnowBtn.setAttribute('data-text', selectedOption && !isIncorrectSelected ? (currentLang === "ru" ? "Далее" : "Next") : (currentLang === "ru" ? "Не знаю" : "Don't Know"));
    dontKnowBtn.textContent = {
        ru: selectedOption && !isIncorrectSelected ? "Далее" : "Не знаю",
        en: selectedOption && !isIncorrectSelected ? "Next" : "Don't Know"
    }[currentLang];
    backBtn.textContent = {
        ru: "Вернуться на главную",
        en: "Back to Main"
    }[currentLang];
    workOnMistakesBtn.textContent = {
        ru: "Работа над ошибками",
        en: "Work on Mistakes"
    }[currentLang];

    if (groupDisplay && resultsDiv.classList.contains("d-none")) {
        if (isMistakes) {
            groupDisplay.textContent = currentLang === "ru" ? "Работа над ошибками" : "Work on Mistakes";
        } else if (isAll) {
            groupDisplay.textContent = currentLang === "ru" ? "Все слова" : "All Words";
        } else if (groupIndex === "my-mistakes") {
            groupDisplay.textContent = currentLang === "ru" ? "Мои ошибки" : "My Mistakes";
        } else {
            groupDisplay.textContent = currentLang === "ru" ? `Группа ${parseInt(groupIndex) + 1}` : `Group ${parseInt(groupIndex) + 1}`;
        }
    }
}

function loadQuestion() {
    console.log('Вызвана функция loadQuestion()');
    console.log('currentWordIndex:', currentWordIndex, 'shuffledWords.length:', shuffledWords.length);
    if (currentWordIndex >= shuffledWords.length) {
        console.log('Тест завершён, показываем результаты');
        showResults();
        return;
    }

    try {
        const word = shuffledWords[currentWordIndex];
        console.log('Текущее слово:', word);
        questionWord.textContent = currentLang === "ru" ? word.russian : word.english;

        if (groupDisplay) {
            if (isMistakes) {
                groupDisplay.textContent = currentLang === "ru" ? "Работа над ошибками" : "Work on Mistakes";
            } else if (isAll) {
                groupDisplay.textContent = currentLang === "ru" ? "Все слова" : "All Words";
            } else if (groupIndex === "my-mistakes") {
                groupDisplay.textContent = currentLang === "ru" ? "Мои ошибки" : "My Mistakes";
            } else {
                groupDisplay.textContent = currentLang === "ru" ? `Группа ${parseInt(groupIndex) + 1}` : `Group ${parseInt(groupIndex) + 1}`;
            }
        }

        progress.textContent = `${currentWordIndex + 1} / ${shuffledWords.length}`;

        const options = generateOptions(word);
        console.log('Сгенерированные варианты ответа:', options);
        optionsDiv.innerHTML = "";
        options.forEach(opt => {
            const btn = document.createElement("button");
            btn.className = 'btn btn-outline-primary option-btn';
            btn.textContent = opt;
            btn.onclick = () => selectOption(opt, word, btn);
            optionsDiv.appendChild(btn);
        });

        speak(currentLang === "ru" ? word.russian : word.english, currentLang === "ru" ? "ru-RU" : "en-US");
        dontKnowBtn.style.display = "block";
        stopBtn.style.display = "block";
        speakBtn.style.display = "block";
        resultsDiv.classList.add("d-none");
        selectedOption = null;
        isIncorrectSelected = false;
        resetOptionColors();
        updateLanguageButtons();
        updateButtonText();
        updateTitle();
    } catch (error) {
        console.error('Ошибка в loadQuestion():', error);
    }
}

function generateOptions(correctWord) {
    console.log('Генерируем варианты ответа для слова:', correctWord);
    const correctAnswer = currentLang === "ru" ? correctWord.english : correctWord.russian;
    const options = [correctAnswer];
    let attempts = 0;
    const maxAttempts = 50;

    while (options.length < 5 && attempts < maxAttempts) {
        const randomWord = shuffledWords[Math.floor(Math.random() * shuffledWords.length)];
        const translation = currentLang === "ru" ? randomWord.english : randomWord.russian;
        if (!options.includes(translation)) {
            options.push(translation);
        }
        attempts++;
    }

    if (options.length < 5) {
        console.warn('Не удалось сгенерировать 5 уникальных вариантов ответа:', options);
    }

    return options.sort(() => Math.random() - 0.5);
}

function selectOption(selected, correctWord, btn) {
    selectedOption = selected;
    const correctAnswer = currentLang === "ru" ? correctWord.english : correctWord.russian;
    const isCorrect = selected === correctAnswer;
    const wordString = JSON.stringify(correctWord);

    const isAlreadyMistake = mistakes.has(wordString);

    if (!isCorrect) {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(500, audioCtx.currentTime);
        oscillator.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);

        btn.classList.remove("btn-outline-primary");
        btn.classList.add("btn-danger");
        mistakes.add(wordString);
        console.log('Добавлена ошибка:', correctWord);
        isIncorrectSelected = true;
        dontKnowBtn.setAttribute('data-text', currentLang === "ru" ? "Не знаю" : "Don't Know");
        dontKnowBtn.textContent = {
            ru: "Не знаю",
            en: "Don't Know"
        }[currentLang];
    } else {
        if (!isAlreadyMistake) {
            correctAnswers++;
            console.log('Правильный ответ с первого раза:', correctWord);
        }
        btn.classList.remove("btn-outline-primary");
        btn.classList.add("btn-success");
        speak(currentLang === "ru" ? correctWord.english : correctWord.russian, currentLang === "ru" ? "en-US" : "ru-RU");
        dontKnowBtn.setAttribute('data-text', currentLang === "ru" ? "Далее" : "Next");
        dontKnowBtn.textContent = {
            ru: "Далее",
            en: "Next"
        }[currentLang];
        isIncorrectSelected = false;
    }
    dontKnowBtn.style.display = "block";
}

function resetOptionColors() {
    const buttons = optionsDiv.querySelectorAll("button");
    buttons.forEach(btn => {
        if (!btn.classList.contains("btn-success") && !btn.classList.contains("btn-danger")) {
            btn.classList.remove("btn-success", "btn-danger");
            btn.classList.add("btn-outline-primary");
        }
    });
}

dontKnowBtn.addEventListener("click", () => {
    const word = shuffledWords[currentWordIndex];
    const wordString = JSON.stringify(word);
    const isAlreadyMistake = mistakes.has(wordString);

    if (dontKnowBtn.getAttribute('data-text') === "Не знаю" || dontKnowBtn.getAttribute('data-text') === "Don't Know") {
        const correctAnswer = currentLang === "ru" ? word.english : word.russian;
        const buttons = optionsDiv.querySelectorAll("button");
        buttons.forEach(btn => {
            if (btn.textContent === correctAnswer) {
                btn.classList.remove("btn-outline-primary");
                btn.classList.add("btn-success");
                speak(currentLang === "ru" ? word.english : word.russian, currentLang === "ru" ? "en-US" : "ru-RU");
            }
        });
        if (!isIncorrectSelected && !isAlreadyMistake) {
            mistakes.add(wordString);
            console.log('Добавлена ошибка (Не знаю):', word);
        }
        dontKnowBtn.setAttribute('data-text', currentLang === "ru" ? "Далее" : "Next");
        dontKnowBtn.textContent = {
            ru: "Далее",
            en: "Next"
        }[currentLang];
        return;
    }

    currentWordIndex++;
    if (currentWordIndex < shuffledWords.length) {
        loadQuestion();
    } else {
        showResults();
    }
});

stopBtn.addEventListener("click", () => {
    showResults();
});

function showResults() {
    questionWord.textContent = '';
    progress.textContent = '';
    if (groupDisplay) groupDisplay.textContent = '';
    optionsDiv.innerHTML = '';
    stopBtn.style.display = "none";
    speakBtn.style.display = "none";
    dontKnowBtn.style.display = "none";
    document.querySelector(".word-container").style.display = "none";
    resultsDiv.classList.remove("d-none");
    mistakesTableBody.innerHTML = "";
    const mistakeWords = Array.from(mistakes).map(m => JSON.parse(m));
    console.log('Ошибки перед сохранением:', mistakeWords);

    correctAnswers = totalWords - mistakeWords.length;

    if (mistakeWords.length === 0) {
        workOnMistakesBtn.style.display = "none";
    } else {
        mistakeWords.forEach(m => {
            const row = document.createElement("tr");
            row.innerHTML = `<td>${m.english}</td><td>${m.russian}</td>`;
            mistakesTableBody.appendChild(row);
        });
    }

    updateResultsText();

    if (!isResultsShown) {
        try {
            localStorage.setItem('currentSessionMistakes', JSON.stringify(mistakeWords));
            console.log('Сохранённые ошибки в localStorage:', JSON.parse(localStorage.getItem('currentSessionMistakes')));
        } catch (error) {
            console.error('Ошибка при сохранении в localStorage:', error);
        }

        saveMistakes();
        isResultsShown = true;
    }

    updateLanguageButtons();
    updateButtonText();
    updateTitle();
    updateTableHeaders();
}

function saveMistakes() {
    try {
        const allMistakes = JSON.parse(localStorage.getItem('mistakes') || '[]');
        Array.from(mistakes).map(m => JSON.parse(m)).forEach(m => {
            if (!allMistakes.some(saved => saved.english === m.english)) {
                allMistakes.push(m);
            }
        });
        localStorage.setItem('mistakes', JSON.stringify(allMistakes));
        console.log('Все ошибки в localStorage:', JSON.parse(localStorage.getItem('mistakes')));
    } catch (error) {
        console.error('Ошибка при сохранении всех ошибок в localStorage:', error);
    }
}

function speak(text, lang) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    speechSynthesis.speak(utterance);
}

speakBtn.addEventListener("click", () => {
    if (shuffledWords.length > 0) {
        speak(currentLang === "ru" ? shuffledWords[currentWordIndex].russian : shuffledWords[currentWordIndex].english, currentLang === "ru" ? "ru-RU" : "en-US");
    }
});

backBtn.addEventListener("click", () => {
    try {
        localStorage.removeItem('currentSessionMistakes');
        console.log('Очищены ошибки сессии');
    } catch (error) {
        console.error('Ошибка при очистке localStorage:', error);
    }
    isResultsShown = false;
    window.location.href = 'index.html';
});

workOnMistakesBtn.addEventListener("click", () => {
    console.log('Кнопка "Work on Mistakes" нажата, привязываем обработчик');
    const mistakeWords = Array.from(mistakes).map(m => JSON.parse(m));
    console.log('Сохранены ошибки перед переходом:', mistakeWords);
    try {
        localStorage.setItem('currentSessionMistakes', JSON.stringify(mistakeWords));
        console.log('Сохранено в localStorage перед переходом:', JSON.parse(localStorage.getItem('currentSessionMistakes')));
    } catch (error) {
        console.error('Ошибка при сохранении перед переходом:', error);
    }
    window.location.href = 'test.html?mistakes=true';
});

const canLoadQuestion = initializeWords();
console.log('canLoadQuestion:', canLoadQuestion, 'shuffledWords.length:', shuffledWords.length);
if (canLoadQuestion && shuffledWords.length > 0) {
    loadQuestion();
}
