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
        comboCounter: document.getElementById('combo-counter'),
        audio: new Audio('assets/sounds/game-music.mp3'),
        bonusSound: new Audio('assets/sounds/bonus.mp3'),
        missSound: new Audio('assets/sounds/miss.mp3')
    };

    // Конфиг
    const config = {
        initialSpeed: 666,
        speedIncrease: 0.10,
        maxLevel: 12,
        buttonSize: 120,
        initialPressTime: 600,
        powerReward: 5,
        powerPenalty: 10,
        bonusChance: 0.15,
        comboPowerBonus: {
            3: 5,
            5: 10,
            10: 20
        },
        pressCooldown: 100 // Защита от двойных нажатий
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
        pressTime: config.initialPressTime,
        combo: 0,
        maxCombo: 0,
        isBonusActive: false,
        lastPressTime: 0
    };

    // Уровни
    const levels = [
        'Лох', 'Слабак', 'Щегол', 'Стремящийся', 'Пацан',
        'Мужик', 'Качок', 'Спортсмен', 'Машина', 'Легенда', 'Тварь',
        'Психованный', 'Обезьянин', 'Турбо-макака'
    ];

    // Инициализация
    function init() {
        setupTelegramFix();
        bindEvents();
        setupAudio();
        resetGame();
    }

    function setupTelegramFix() {
        if (window.Telegram?.WebApp) {
            document.body.style.cssText = `
                -webkit-touch-callout: none;
                -webkit-user-select: none;
                touch-action: manipulation;
            `;
        }
    }

    function bindEvents() {
        // Основные кнопки
        elements.startButton.addEventListener('click', startGame);
        elements.restartButton.addEventListener('click', restartGame);

        // Улучшенная система обработки нажатий
        const handleInteraction = (e) => {
            e.preventDefault();
            const now = Date.now();
            if (now - state.lastPressTime < config.pressCooldown) return;
            state.lastPressTime = now;
            
            if (!state.pressVisible || !state.isRunning) return;
            
            // Визуальная обратная связь
            elements.pressButton.style.transform = 'translate(-50%, -50%) scale(0.9)';
            setTimeout(() => {
                elements.pressButton.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 100);
            
            hitAction();
        };

        // Все возможные типы событий
        const eventTypes = [
            'mousedown', 'touchstart', 'pointerdown', 'click'
        ];
        
        eventTypes.forEach(type => {
            elements.pressButton.addEventListener(type, handleInteraction, { 
                passive: type !== 'touchstart' 
            });
        });
    }

    function setupAudio() {
        elements.audio.loop = true;
        elements.audio.volume = 0.3;
        elements.bonusSound.volume = 0.7;
        elements.missSound.volume = 0.5;
        
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
        state.combo = 0;
        state.maxCombo = 0;
        state.isBonusActive = false;
        state.lastPressTime = 0;
        
        elements.pressButton.classList.add('hidden');
        elements.pressButton.style.transform = 'translate(-50%, -50%) scale(1)';
        elements.pressButton.style.background = '';
        elements.comboCounter.textContent = '';
        elements.comboCounter.style.color = '';
        
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
        
        // Сброс состояний
        state.isBonusActive = false;
        elements.pressButton.style.background = '';
        elements.pressButton.classList.remove('bonus-glow', 'shake');
        
        // Случайный бонус
        if (Math.random() < config.bonusChance) {
            state.isBonusActive = true;
            elements.pressButton.style.background = 'radial-gradient(circle, gold, orange)';
            elements.pressButton.classList.add('bonus-glow');
        }

        // Позиционирование кнопки
        const gameRect = elements.gameScreen.getBoundingClientRect();
        const buttonHalfSize = config.buttonSize / 2;
        const centerY = gameRect.height / 2;
        
        const positions = [
            { x: gameRect.width / 2, y: centerY - 100 },
            { x: gameRect.width / 2, y: centerY },
            { x: gameRect.width / 2, y: centerY + 100 }
        ];
        
        const randomPos = positions[Math.floor(Math.random() * positions.length)];
        
        elements.pressButton.style.left = `${randomPos.x}px`;
        elements.pressButton.style.top = `${randomPos.y}px`;
        
        state.pressVisible = true;
        elements.pressButton.classList.remove('hidden');
        
        state.pressTimeout = setTimeout(() => {
            if (state.pressVisible) {
                missAction();
            }
        }, state.pressTime);
    }

    function hidePress() {
        state.pressVisible = false;
        elements.pressButton.classList.add('hidden');
        elements.pressButton.classList.remove('bonus-glow');
    }

    function hitAction() {
        hidePress();
        
        // Комбо-система
        state.combo++;
        if (state.combo > state.maxCombo) {
            state.maxCombo = state.combo;
        }
        updateCombo();
        
        // Бонус за комбо
        if (config.comboPowerBonus[state.combo]) {
            changePower(config.comboPowerBonus[state.combo]);
            showBonusEffect();
        }
        
        // Бонусная кнопка
        if (state.isBonusActive) {
            changePower(15);
            elements.bonusSound.play();
            showBonusEffect();
        }
        
        moveUp();
        schedulePress();
    }

    function missAction() {
        elements.missSound.play();
        elements.pressButton.classList.add('shake');
        changePower(-config.powerPenalty);
        state.combo = 0;
        updateCombo();
        hidePress();
        
        if (state.isRunning) {
            setTimeout(() => {
                schedulePress();
            }, 500);
        }
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
        
        // Бонус за комбо
        if (state.combo >= 3 && state.combo % 3 === 0) {
            state.score++;
        }
        
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

    function updateCombo() {
        if (state.combo > 1) {
            elements.comboCounter.textContent = `x${state.combo}`;
            const hue = Math.min(state.combo * 10, 120);
            elements.comboCounter.style.color = `hsl(${hue}, 100%, 50%)`;
            elements.comboCounter.classList.add('show');
        } else {
            elements.comboCounter.classList.remove('show');
        }
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

    function showBonusEffect() {
        const effect = document.createElement('div');
        effect.className = 'bonus-effect';
        effect.textContent = state.isBonusActive ? 'БОНУС!' : 'КОМБО!';
        effect.style.left = `${elements.pressButton.offsetLeft}px`;
        effect.style.top = `${elements.pressButton.offsetTop - 50}px`;
        elements.gameScreen.appendChild(effect);
        
        setTimeout(() => {
            effect.remove();
        }, 1000);
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