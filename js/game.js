document.addEventListener('DOMContentLoaded', () => {
    // Элементы
    const elements = {
        menuScreen: document.getElementById('menu-screen'),
        gameScreen: document.getElementById('game-screen'),
        gameOverScreen: document.getElementById('game-over-screen'),
        character: document.getElementById('character'),
        pressButton: document.getElementById('press-button'),
        score: document.getElementById('score'),
        level: document.getElementById('level'),
        powerBar: document.getElementById('power-bar'),
        redOverlay: document.getElementById('red-overlay'),
        startButton: document.getElementById('start-button'),
        restartButton: document.getElementById('restart-button'),
        audio: new Audio('assets/sounds/game-music.mp3')
    };

    // Конфиг
    const config = {
        initialSpeed: 666,
        speedIncrease: 0.10,
        maxLevel: 12,
        buttonSize: 120,
        initialPressTime: 600,
        powerReward: 5,
        powerPenalty: 10 // Вернули штраф 10% за пропуск
    };

    // Состояние
    const state = {
        position: 'bottom',
        score: 0,
        level: 0,
        power: 100,
        speed: config.initialSpeed,
        isRunning: false,
        pressVisible: false,
        pressTimeout: null,
        pressTime: config.initialPressTime
    };

    // Уровни
    const levels = [
        'Лох', 'Слабак', 'Щегол', 'Стремящийся', 'Пацан',
        'Мужик', 'Качок', 'Спортсмен', 'Машина', 'Легенда', 'Тварь',
        'Психованный', 'Обезьянин', 'Турбо-макака'
    ];

    // Инициализация
    function init() {
        bindEvents();
        setupAudio();
        resetGame();
    }

    function bindEvents() {
        elements.startButton.addEventListener('click', startGame);
        elements.restartButton.addEventListener('click', restartGame);
        elements.pressButton.addEventListener('click', handleButtonClick);
    }

    function setupAudio() {
        elements.audio.loop = true;
        elements.audio.volume = 0.5;
        document.addEventListener('click', () => {
            elements.audio.play().catch(e => console.log('Audio play error:', e));
        }, { once: true });
    }

    function startGame() {
        elements.menuScreen.classList.add('hidden');
        elements.gameScreen.classList.remove('hidden');
        elements.audio.play().catch(e => console.log('Audio play error:', e));
        resetGame();
        state.isRunning = true;
        schedulePress();
    }

    function restartGame() {
        elements.gameOverScreen.classList.add('hidden');
        elements.gameScreen.classList.remove('hidden');
        elements.audio.play().catch(e => console.log('Audio play error:', e));
        resetGame();
        state.isRunning = true;
        schedulePress();
    }

    function resetGame() {
        clearTimeout(state.pressTimeout);
        state.position = 'bottom';
        state.score = 0;
        state.level = 0;
        state.power = 100;
        state.speed = config.initialSpeed;
        state.isRunning = false;
        state.pressVisible = false;
        state.pressTime = config.initialPressTime;
        elements.pressButton.classList.add('hidden');
        updateUI();
        updateCharacter();
    }

    function schedulePress() {
        if (!state.isRunning) return;
        clearTimeout(state.pressTimeout);
        state.pressTimeout = setTimeout(() => {
            showPress();
        }, state.speed);
    }

    function showPress() {
        if (!state.isRunning) return;
        
        // Три близкие позиции для кнопки (в центральной части экрана)
        const gameRect = elements.gameScreen.getBoundingClientRect();
        const buttonHalfSize = config.buttonSize / 2;
        const centerY = gameRect.height / 2;
        
        const positions = [
            { x: gameRect.width / 2, y: centerY - 100 }, // Чуть выше центра
            { x: gameRect.width / 2, y: centerY },       // Центр
            { x: gameRect.width / 2, y: centerY + 100 }  // Чуть ниже центра
        ];
        
        const randomPos = positions[Math.floor(Math.random() * positions.length)];
        
        elements.pressButton.style.left = `${randomPos.x}px`;
        elements.pressButton.style.top = `${randomPos.y}px`;
        
        state.pressVisible = true;
        elements.pressButton.classList.remove('hidden');
        
        state.pressTimeout = setTimeout(() => {
            if (state.pressVisible) {
                hidePress();
                changePower(-config.powerPenalty); // Штраф 10% за пропуск
                schedulePress();
            }
        }, state.pressTime);
    }

    function hidePress() {
        state.pressVisible = false;
        elements.pressButton.classList.add('hidden');
    }

    function handleButtonClick() {
        if (!state.isRunning || !state.pressVisible) return;
        hitAction();
    }

    function hitAction() {
        hidePress();
        moveUp();
        schedulePress();
    }

    function moveUp() {
        switch(state.position) {
            case 'bottom':
                state.position = 'middle';
                updateCharacter();
                break;
            case 'middle':
                state.position = 'top';
                updateCharacter();
                setTimeout(() => {
                    state.position = 'bottom';
                    updateCharacter();
                    addScore();
                    changePower(config.powerReward);
                }, 300);
                break;
        }
    }

    function addScore() {
        state.score++;
        if (state.level < config.maxLevel) {
            const newLevel = Math.floor(state.score / 5);
            if (newLevel > state.level) {
                state.level = newLevel;
                state.speed = config.initialSpeed * Math.pow(0.9, state.level);
                state.pressTime = Math.max(300, config.initialPressTime - (state.level * 20));
            }
        }
        updateUI();
    }

    function changePower(amount) {
        state.power = Math.max(0, Math.min(100, state.power + amount));
        if (state.power <= 0) {
            endGame();
        }
        updateUI();
    }

    function updateCharacter() {
        elements.character.src = `assets/images/character-${state.position}.png`;
    }

    function updateUI() {
        elements.score.textContent = state.score;
        elements.level.textContent = levels[Math.min(state.level, config.maxLevel)];
        elements.powerBar.style.height = `${state.power}%`;

        const redness = Math.min(0.7, state.score / 100);
        elements.redOverlay.style.backgroundColor = `rgba(255, 0, 0, ${redness})`;
    }

    function endGame() {
        state.isRunning = false;
        clearTimeout(state.pressTimeout);
        elements.audio.pause();
        document.getElementById('final-score').textContent = state.score;
        document.getElementById('final-level').textContent = 
            levels[Math.min(state.level, config.maxLevel)];
        elements.gameScreen.classList.add('hidden');
        elements.gameOverScreen.classList.remove('hidden');
    }

    init();
});