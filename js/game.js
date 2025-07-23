document.addEventListener('DOMContentLoaded', () => {
    // Элементы
    const elements = {
        menuScreen: document.getElementById('menu-screen'),
        gameScreen: document.getElementById('game-screen'),
        gameOverScreen: document.getElementById('game-over-screen'),
        character: document.getElementById('character'),
        pressText: document.getElementById('press-text'),
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
        maxLevel: 12 // Турбо-макака
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
        pressTimeout: null
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
        document.addEventListener('click', handleClick);
        document.addEventListener('touchstart', handleClick);
    }

    function setupAudio() {
        elements.audio.loop = true;
        elements.audio.volume = 0.5;
        document.addEventListener('click', () => {
            elements.audio.play().catch(e => console.log('Audio play error'));
        }, { once: true });
    }

    function startGame() {
        elements.menuScreen.classList.add('hidden');
        elements.gameScreen.classList.remove('hidden');
        elements.audio.play().catch(e => console.log('Audio play error'));
        resetGame();
        state.isRunning = true;
        schedulePress();
    }

    function restartGame() {
        elements.gameOverScreen.classList.add('hidden');
        elements.gameScreen.classList.remove('hidden');
        elements.audio.play().catch(e => console.log('Audio play error'));
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
        
        state.pressVisible = true;
        elements.pressText.style.display = 'block';
        
        state.pressTimeout = setTimeout(() => {
            if (state.pressVisible) {
                hidePress();
                missAction();
            }
        }, 500);
    }

    function hidePress() {
        state.pressVisible = false;
        elements.pressText.style.display = 'none';
    }

    function handleClick(e) {
        if (!state.isRunning) return;
        
        if (state.pressVisible) {
            hitAction();
        } else {
            missAction();
        }
    }

    function hitAction() {
        hidePress();
        moveUp();
        schedulePress();
    }

    function missAction() {
        changePower(-10);
        if (state.isRunning) schedulePress();
    }

    function moveUp() {
        switch(state.position) {
            case 'bottom':
                state.position = 'middle';
                break;
            case 'middle':
                state.position = 'top';
                changePower(2); // +2% при достижении верха
                setTimeout(() => {
                    state.position = 'bottom';
                    updateCharacter();
                    addScore();
                }, 300);
                break;
        }
        updateCharacter();
    }

    function addScore() {
        state.score++;
        
        // Фиксируем уровень после достижения максимума
        if (state.level < config.maxLevel) {
            const newLevel = Math.floor(state.score / 5);
            if (newLevel > state.level) {
                state.level = newLevel;
                state.speed = config.initialSpeed * Math.pow(0.9, state.level);
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
        elements.level.textContent = levels[Math.min(state.level, config.maxLevel)]; // Фиксируем уровень
        elements.powerBar.style.height = `${state.power}%`;
        
        // Покраснение фона
        const redness = Math.min(0.7, state.score / 100);
        elements.redOverlay.style.backgroundColor = `rgba(255, 0, 0, ${redness})`;
    }

    function endGame() {
        state.isRunning = false;
        clearTimeout(state.pressTimeout);
        elements.audio.pause();
        document.getElementById('final-score').textContent = state.score;
        document.getElementById('final-level').textContent = levels[Math.min(state.level, config.maxLevel)];
        elements.gameScreen.classList.add('hidden');
        elements.gameOverScreen.classList.remove('hidden');
    }

    init();
});