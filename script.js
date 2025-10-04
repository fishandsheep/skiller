class SkillGomoku {
    constructor() {
        this.boardSize = 15;
        this.board = [];
        this.currentPlayer = 1;
        this.gameOver = false;
        this.roundNumber = 1;
        this.gameMode = 'pvp'; // pvp or pve
        
        // 能量系统
        this.energy = {
            1: 1,
            2: 1
        };
        
        // 技能冷却系统
        this.skillCooldowns = {
            1: { feishazoushi: 0, jingruzhishui: 0, libashanxi: 0 },
            2: { feishazoushi: 0, jingruzhishui: 0, libashanxi: 0 }
        };
        
        // 技能配置
        this.skills = {
            feishazoushi: {
                name: '飞沙走石',
                cost: 3,
                cooldown: 3,
                description: '随机移除对手的1-3个棋子'
            },
            jingruzhishui: {
                name: '静如止水',
                cost: 2,
                cooldown: 4,
                description: '使对手下一回合无法下棋'
            },
            libashanxi: {
                name: '力拔山兮',
                cost: 5,
                cooldown: 0,
                description: '摔坏棋盘，直接获得胜利'
            }
        };
        
        // 特殊状态
        this.frozenPlayer = null; // 被静如止水影响的玩家
        
        // 回合行动系统
        this.turnActionTaken = false; // 当前回合是否已执行行动
        
        
        this.init();
    }
    
    init() {
        this.initializeBoard();
        this.setupEventListeners();
        this.renderBoard();
        this.updateUI();
    }
    
    initializeBoard() {
        this.board = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(0));
    }
    
    setupEventListeners() {
        // 游戏模式切换
        document.getElementById('pvp-mode').addEventListener('click', () => this.setGameMode('pvp'));
        document.getElementById('pve-mode').addEventListener('click', () => this.setGameMode('pve'));
        
        // 技能按钮
        document.getElementById('skill-feishazoushi').addEventListener('click', () => this.useSkill('feishazoushi'));
        document.getElementById('skill-jingruzhishui').addEventListener('click', () => this.useSkill('jingruzhishui'));
        document.getElementById('skill-libashanxi').addEventListener('click', () => this.useSkill('libashanxi'));
        
        // 重新开始按钮
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('menu-btn').addEventListener('click', () => this.backToMenu());
    }
    
    setGameMode(mode) {
        this.gameMode = mode;
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${mode}-mode`).classList.add('active');
        this.restartGame();
    }
    
    
    
    
    
    
    
    
    
    
    
    
    renderBoard() {
        const boardElement = document.getElementById('game-board');
        boardElement.innerHTML = '';
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener('click', () => this.handleCellClick(row, col));
                
                if (this.board[row][col] !== 0) {
                    const piece = document.createElement('div');
                    piece.className = `piece ${this.board[row][col] === 1 ? 'black' : 'white'}`;
                    cell.appendChild(piece);
                }
                
                boardElement.appendChild(cell);
            }
        }
    }
    
    handleCellClick(row, col) {
        if (this.gameOver) return;
        
        // 检查玩家是否被冻结
        if (this.frozenPlayer === this.currentPlayer) {
            this.showMessage('你被静如止水技能影响，这回合无法下棋！');
            return;
        }
        
        // 检查本回合是否已使用技能
        if (this.turnActionTaken) {
            this.showMessage('本回合已使用技能，不能下棋！');
            return;
        }
        
        // 检查位置是否为空
        if (this.board[row][col] !== 0) {
            this.showMessage('此位置已有棋子！');
            return;
        }
        
        this.placePiece(row, col);
    }
    
    placePiece(row, col) {
        this.board[row][col] = this.currentPlayer;
        this.renderBoard();
        
        // 标记本回合已使用行动
        this.turnActionTaken = true;
        
        // 添加放置动画
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        const piece = cell.querySelector('.piece');
        if (piece) {
            piece.style.animation = 'placepiece 0.3s ease';
        }
        
        // 检查获胜
        if (this.checkWin(row, col)) {
            this.endGame(this.currentPlayer);
            return;
        }
        
        // 检查平局
        if (this.checkDraw()) {
            this.endGame(0);
            return;
        }
        
        this.nextTurn();
    }
    
    nextTurn() {
        // 重置冻结状态（如果当前玩家是被冻结的，现在解冻）
        if (this.frozenPlayer === this.currentPlayer) {
            this.frozenPlayer = null;
        }
        
        // 切换玩家
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        
        // 检查新玩家是否被冻结
        if (this.frozenPlayer === this.currentPlayer) {
            // 新玩家被冻结，显示消息并自动跳过其回合
            const playerName = this.currentPlayer === 1 ? '玩家 1' : (this.gameMode === 'pve' ? 'AI' : '玩家 2');
            this.showMessage(`${playerName} 被静如止水影响，跳过回合！`);
            
            // 延迟后继续下一个回合
            setTimeout(() => {
                this.frozenPlayer = null; // 解冻玩家
                this.nextTurn(); // 递归调用进入下一个回合
            }, 2000);
            return;
        }
        
        // 重置行动状态
        this.turnActionTaken = false;
        
        // 更新冷却时间
        this.updateCooldowns();
        
        // 增加能量（每回合+1，最多5）
        if (this.energy[this.currentPlayer] < 5) {
            this.energy[this.currentPlayer]++;
        }
        
        // 增加回合数
        if (this.currentPlayer === 1) {
            this.roundNumber++;
        }
        
        this.updateUI();
        
        // AI移动（如果是人机模式）
        if (this.gameMode === 'pve' && this.currentPlayer === 2) {
            setTimeout(() => this.aiMove(), 1000);
        }
    }
    
    updateCooldowns() {
        for (let skill in this.skillCooldowns[this.currentPlayer]) {
            if (this.skillCooldowns[this.currentPlayer][skill] > 0) {
                this.skillCooldowns[this.currentPlayer][skill]--;
            }
        }
    }
    
    checkWin(row, col) {
        const directions = [
            [[0, 1], [0, -1]], // 横向
            [[1, 0], [-1, 0]], // 纵向
            [[1, 1], [-1, -1]], // 对角线1
            [[1, -1], [-1, 1]]  // 对角线2
        ];
        
        for (let direction of directions) {
            let count = 1;
            
            for (let [dr, dc] of direction) {
                let r = row + dr;
                let c = col + dc;
                
                while (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize && 
                       this.board[r][c] === this.currentPlayer) {
                    count++;
                    r += dr;
                    c += dc;
                }
            }
            
            if (count >= 5) {
                return true;
            }
        }
        
        return false;
    }
    
    checkDraw() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0) {
                    return false;
                }
            }
        }
        return true;
    }
    
    useSkill(skillName) {
        if (this.gameOver) return;
        
        const player = this.currentPlayer;
        const skill = this.skills[skillName];
        
        // 检查本回合是否已下棋
        if (this.turnActionTaken) {
            this.showMessage('本回合已下棋，不能使用技能！');
            return;
        }
        
        // 检查能量是否足够
        if (this.energy[player] < skill.cost) {
            this.showMessage('能量不足！');
            return;
        }
        
        // 检查冷却时间
        if (this.skillCooldowns[player][skillName] > 0) {
            this.showMessage(`技能冷却中，还需 ${this.skillCooldowns[player][skillName]} 回合`);
            return;
        }
        
        // 扣除能量
        this.energy[player] -= skill.cost;
        
        // 设置冷却时间
        this.skillCooldowns[player][skillName] = skill.cooldown;
        
        // 标记本回合已使用行动
        this.turnActionTaken = true;
        
        // 执行技能效果
        this.executeSkill(skillName);
        
        // 更新UI
        this.updateUI();
    }
    
    executeSkill(skillName) {
        switch (skillName) {
            case 'feishazoushi':
                this.executeFeishazoushi();
                break;
            case 'jingruzhishui':
                this.executeJingruzhishui();
                break;
            case 'libashanxi':
                this.executeLibashanxi();
                break;
        }
    }
    
    executeFeishazoushi() {
        const opponent = this.currentPlayer === 1 ? 2 : 1;
        const opponentPieces = [];
        
        // 收集对手所有棋子
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === opponent) {
                    opponentPieces.push({row, col});
                }
            }
        }
        
        if (opponentPieces.length === 0) {
            this.showMessage('对手没有棋子可以移除！');
            this.energy[this.currentPlayer] += this.skills.feishazoushi.cost; // 退还能量
            this.turnActionTaken = false; // 重置行动状态，因为技能无效
            this.updateUI();
            return;
        }
        
        // 随机选择1-3个棋子移除
        const removeCount = Math.min(Math.floor(Math.random() * 3) + 1, opponentPieces.length);
        const shuffled = opponentPieces.sort(() => Math.random() - 0.5);
        const toRemove = shuffled.slice(0, removeCount);
        
        
        // 添加特效
        this.showSkillEffect('feishazoushi');
        
        // 移除棋子到什刹海
        setTimeout(() => {
            toRemove.forEach(({row, col}, index) => {
                const pieceType = opponent === 1 ? 'black' : 'white';
                
                // 延迟每个棋子的移动，创造波浪效果
                setTimeout(() => {
                    // 移动棋子到什刹海
                    this.movePieceToShichahai(row, col, pieceType);
                    
                    // 从棋盘上移除
                    this.board[row][col] = 0;
                    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    const piece = cell.querySelector('.piece');
                    if (piece) {
                        piece.classList.add('removing');
                    }
                }, index * 200);
            });
            
            // 最后更新棋盘和切换回合
            setTimeout(() => {
                this.renderBoard();
                this.showMessage(`飞沙走石将 ${removeCount} 个棋子吹入什刹海！`);
                // 技能执行完成，切换回合
                this.nextTurn();
            }, removeCount * 200 + 1600);
        }, 800);
    }
    
    executeJingruzhishui() {
        const opponent = this.currentPlayer === 1 ? 2 : 1;
        this.frozenPlayer = opponent;
        
        // 添加特效
        this.showSkillEffect('jingruzhishui');
        
        this.showMessage('静如止水！对手下一回合无法下棋！');
        
        // 技能执行完成，切换回合
        setTimeout(() => {
            this.nextTurn();
        }, 1000);
    }
    
    executeLibashanxi() {
        // 添加屏幕震动效果
        document.body.classList.add('screen-shake');
        
        // 添加胜利闪光效果
        this.createVictoryFlash();
        
        // 添加棋盘破坏特效
        this.showSkillEffect('libashanxi');
        
        setTimeout(() => {
            document.body.classList.remove('screen-shake');
            this.endGame(this.currentPlayer, '力拔山兮！');
        }, 2000);
    }
    
    showSkillEffect(skillName) {
        const board = document.getElementById('game-board');
        const effect = document.createElement('div');
        effect.className = `skill-effect ${skillName}-effect`;
        board.appendChild(effect);
        
        // 为飞沙走石添加额外的粒子效果
        if (skillName === 'feashazoushi') {
            this.createSandParticles(effect);
        } else if (skillName === 'jingruzhishui') {
            this.createIceParticles(effect);
            this.createIceCrystals(effect);
        } else if (skillName === 'libashanxi') {
            this.createBoardDestruction(effect);
        }
        
        setTimeout(() => {
            effect.remove();
        }, 3000);
    }
    
    createSandParticles(container) {
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'sand-particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 2 + 's';
                particle.style.animationDuration = (1.5 + Math.random() * 1) + 's';
                container.appendChild(particle);
            }, i * 50);
        }
    }
    
    createIceParticles(container) {
        // 创建冰粒子效果
        for (let i = 0; i < 25; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'ice-particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 1.5 + 's';
                particle.style.animationDuration = (2 + Math.random() * 1) + 's';
                container.appendChild(particle);
            }, i * 30);
        }
    }
    
    createIceCrystals(container) {
        // 创建冰晶效果
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const crystal = document.createElement('div');
                crystal.className = 'ice-crystal';
                crystal.style.left = (10 + Math.random() * 80) + '%';
                crystal.style.top = (10 + Math.random() * 80) + '%';
                crystal.style.animationDelay = Math.random() * 0.5 + 's';
                crystal.style.width = crystal.style.height = (15 + Math.random() * 20) + 'px';
                container.appendChild(crystal);
            }, i * 100);
        }
    }
    
    createBoardDestruction(container) {
        // 创建棋盘裂缝效果
        this.createBoardCracks(container);
        
        // 创建棋盘碎片效果
        setTimeout(() => {
            this.createBoardShards(container);
        }, 500);
        
        // 创建棋子掉落效果
        setTimeout(() => {
            this.createFallingPieces();
        }, 800);
    }
    
    createBoardCracks(container) {
        // 创建多条裂缝
        for (let i = 0; i < 6; i++) {
            setTimeout(() => {
                const crack = document.createElement('div');
                crack.className = 'board-crack';
                
                // 随机裂缝的位置和大小
                const width = 2 + Math.random() * 4;
                const height = 20 + Math.random() * 60;
                const angle = Math.random() * 360;
                
                crack.style.width = width + 'px';
                crack.style.height = height + 'px';
                crack.style.left = (20 + Math.random() * 60) + '%';
                crack.style.top = (20 + Math.random() * 60) + '%';
                crack.style.transform = `rotate(${angle}deg)`;
                crack.style.animationDelay = (i * 0.1) + 's';
                
                container.appendChild(crack);
            }, i * 100);
        }
    }
    
    createBoardShards(container) {
        // 创建飞散的木片
        for (let i = 0; i < 12; i++) {
            setTimeout(() => {
                const shard = document.createElement('div');
                shard.className = 'board-shard';
                
                // 随机碎片的大小和形状
                const width = 15 + Math.random() * 25;
                const height = 10 + Math.random() * 20;
                
                shard.style.width = width + 'px';
                shard.style.height = height + 'px';
                shard.style.left = (20 + Math.random() * 60) + '%';
                shard.style.top = (20 + Math.random() * 60) + '%';
                
                // 设置自定义变量用于动画
                const tx = (Math.random() - 0.5) * 100;
                const ty = (Math.random() - 0.5) * 100;
                const r = (Math.random() - 0.5) * 360;
                
                shard.style.setProperty('--tx', tx + 'px');
                shard.style.setProperty('--ty', ty + 'px');
                shard.style.setProperty('--r', r + 'deg');
                shard.style.animationDelay = (i * 50) + 'ms';
                
                container.appendChild(shard);
            }, i * 50);
        }
    }
    
    createFallingPieces() {
        // 让棋盘上的棋子掉落
        const cells = document.querySelectorAll('.cell');
        cells.forEach((cell, index) => {
            if (cell.classList.contains('black') || cell.classList.contains('white')) {
                setTimeout(() => {
                    const piece = document.createElement('div');
                    piece.className = `falling-piece ${cell.classList.contains('black') ? 'black' : 'white'}`;
                    
                    // 获取棋子在屏幕上的位置
                    const rect = cell.getBoundingClientRect();
                    piece.style.left = rect.left + (rect.width / 2 - 15) + 'px';
                    piece.style.top = rect.top + (rect.height / 2 - 15) + 'px';
                    piece.style.position = 'fixed';
                    
                    document.body.appendChild(piece);
                    
                    // 移除原棋子
                    cell.classList.remove('black', 'white');
                    
                    // 清理掉落的棋子
                    setTimeout(() => {
                        piece.remove();
                    }, 1500);
                }, Math.random() * 300);
            }
        });
    }
    
    createVictoryFlash() {
        // 创建胜利闪光效果
        const flash = document.createElement('div');
        flash.className = 'victory-flash';
        document.body.appendChild(flash);
        
        // 清理闪光效果
        setTimeout(() => {
            flash.remove();
        }, 2000);
    }
    
    movePieceToShichahai(row, col, pieceType) {
        const seaPieces = document.getElementById('sea-pieces');
        const seaPiece = document.createElement('div');
        seaPiece.className = `sea-piece ${pieceType} entering`;
        
        // 获取原棋子在棋盘上的位置
        const boardElement = document.getElementById('game-board');
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        const boardRect = boardElement.getBoundingClientRect();
        const cellRect = cell.getBoundingClientRect();
        const seaRect = document.getElementById('shichahai-sea').getBoundingClientRect();
        
        // 计算相对位置
        const startX = cellRect.left - boardRect.left + cellRect.width / 2;
        const startY = cellRect.top - boardRect.top + cellRect.height / 2;
        const endX = seaRect.left - boardRect.left + seaRect.width / 2 + (Math.random() - 0.5) * 100;
        const endY = seaRect.top - boardRect.top + seaRect.height / 2 + (Math.random() - 0.5) * 40;
        
        // 创建移动动画
        seaPiece.style.position = 'absolute';
        seaPiece.style.left = startX + 'px';
        seaPiece.style.top = startY + 'px';
        seaPiece.style.zIndex = '200';
        boardElement.appendChild(seaPiece);
        
        // 执行移动动画
        setTimeout(() => {
            seaPiece.style.transition = 'all 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            seaPiece.style.left = endX + 'px';
            seaPiece.style.top = endY + 'px';
            seaPiece.style.transform = 'rotate(720deg) scale(0.5)';
        }, 100);
        
        // 移动到什刹海
        setTimeout(() => {
            seaPiece.remove();
            const finalSeaPiece = document.createElement('div');
            finalSeaPiece.className = `sea-piece ${pieceType}`;
            seaPieces.appendChild(finalSeaPiece);
        }, 1600);
    }
    
        
    aiMove() {
        if (this.gameOver) return;
        
        // 检查AI是否被冻结
        if (this.frozenPlayer === 2) {
            this.showMessage('AI被静如止水技能影响，这回合无法下棋！');
            this.nextTurn();
            return;
        }
        
        // 简单的AI策略
        const move = this.getBestMove();
        if (move) {
            this.placePiece(move.row, move.col);
        }
    }
    
    getBestMove() {
        // 优先级：
        // 1. 自己能赢
        // 2. 阻止对手赢
        // 3. 使用技能
        // 4. 随机移动
        
        // 检查自己能否赢
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0) {
                    this.board[row][col] = 2;
                    if (this.checkWin(row, col)) {
                        this.board[row][col] = 0;
                        return {row, col};
                    }
                    this.board[row][col] = 0;
                }
            }
        }
        
        // 检查是否需要阻止对手赢
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0) {
                    this.board[row][col] = 1;
                    if (this.checkWin(row, col)) {
                        this.board[row][col] = 0;
                        return {row, col};
                    }
                    this.board[row][col] = 0;
                }
            }
        }
        
        // 随机选择可用技能
        if (Math.random() < 0.3 && this.energy[2] >= 2) {
            const availableSkills = Object.keys(this.skills).filter(skill => 
                this.energy[2] >= this.skills[skill].cost && 
                this.skillCooldowns[2][skill] === 0
            );
            
            if (availableSkills.length > 0) {
                const randomSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
                this.useSkill(randomSkill);
                return null;
            }
        }
        
        // 随机移动
        const availableMoves = [];
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0) {
                    availableMoves.push({row, col});
                }
            }
        }
        
        if (availableMoves.length > 0) {
            return availableMoves[Math.floor(Math.random() * availableMoves.length)];
        }
        
        return null;
    }
    
    updateUI() {
        // 更新当前玩家
        document.getElementById('current-player').textContent = 
            this.currentPlayer === 1 ? '玩家 1' : (this.gameMode === 'pve' ? 'AI' : '玩家 2');
        
        // 更新回合数
        document.getElementById('round-number').textContent = this.roundNumber;
        
        // 更新行动状态
        this.updateActionStatus();
        
        // 更新能量条
        this.updateEnergyBar(1);
        this.updateEnergyBar(2);
        
        // 更新技能按钮状态
        this.updateSkillButtons();
        
        // 更新玩家信息高亮
        document.querySelectorAll('.player-info').forEach(info => {
            info.classList.remove('active');
        });
        
        const currentPlayerInfo = document.querySelector(
            this.currentPlayer === 1 ? '.player-info.player1' : '.player-info.player2'
        );
        if (currentPlayerInfo) {
            currentPlayerInfo.classList.add('active');
        }
    }
    
    updateActionStatus() {
        const actionStatus = document.getElementById('action-status');
        
        if (this.turnActionTaken) {
            actionStatus.textContent = '本回合行动已使用';
            actionStatus.classList.add('limited');
        } else {
            actionStatus.textContent = '可下棋或使用技能';
            actionStatus.classList.remove('limited');
        }
    }
    
    updateEnergyBar(player) {
        const energyFill = document.getElementById(`player${player}-energy`);
        const energyCount = document.getElementById(`player${player}-energy-count`);
        
        const percentage = (this.energy[player] / 5) * 100;
        energyFill.style.width = `${percentage}%`;
        energyCount.textContent = `${this.energy[player]}/5`;
    }
    
    updateSkillButtons() {
        const player = this.currentPlayer;
        
        Object.keys(this.skills).forEach(skillName => {
            const skill = this.skills[skillName];
            const button = document.getElementById(`skill-${skillName}`);
            const card = button.closest('.skill-card');
            
            // 移除所有状态类
            card.classList.remove('available', 'cooldown', 'insufficient-energy', 'action-used');
            
            // 检查技能是否可用
            const hasEnoughEnergy = this.energy[player] >= skill.cost;
            const isOnCooldown = this.skillCooldowns[player][skillName] > 0;
            const actionUsed = this.turnActionTaken;
            
            if (actionUsed) {
                card.classList.add('action-used');
                button.disabled = true;
                button.textContent = '本回合已行动';
                
                // 移除冷却覆盖层
                const cooldownOverlay = card.querySelector('.cooldown-overlay');
                if (cooldownOverlay) {
                    cooldownOverlay.remove();
                }
            } else if (isOnCooldown) {
                card.classList.add('cooldown');
                button.disabled = true;
                button.textContent = `冷却中 (${this.skillCooldowns[player][skillName]})`;
                
                // 显示冷却覆盖层
                let cooldownOverlay = card.querySelector('.cooldown-overlay');
                if (!cooldownOverlay) {
                    cooldownOverlay = document.createElement('div');
                    cooldownOverlay.className = 'cooldown-overlay';
                    card.appendChild(cooldownOverlay);
                }
                cooldownOverlay.textContent = this.skillCooldowns[player][skillName];
            } else if (!hasEnoughEnergy) {
                card.classList.add('insufficient-energy');
                button.disabled = true;
                button.textContent = '能量不足';
                
                // 移除冷却覆盖层
                const cooldownOverlay = card.querySelector('.cooldown-overlay');
                if (cooldownOverlay) {
                    cooldownOverlay.remove();
                }
            } else {
                card.classList.add('available');
                button.disabled = false;
                button.textContent = '使用';
                
                // 移除冷却覆盖层
                const cooldownOverlay = card.querySelector('.cooldown-overlay');
                if (cooldownOverlay) {
                    cooldownOverlay.remove();
                }
            }
        });
    }
    
    showMessage(message) {
        // 简单的消息提示（可以后续改为更美观的toast）
        console.log(message);
        // 临时使用alert，后续会改进
        // alert(message);
    }
    
    endGame(winner, reason = '') {
        this.gameOver = true;
        
        const modal = document.getElementById('game-over-modal');
        const winnerText = document.getElementById('winner-text');
        const gameResult = document.getElementById('game-result');
        
        if (winner === 0) {
            winnerText.textContent = '平局！';
            gameResult.textContent = '棋盘已满，游戏结束！';
        } else {
            const winnerName = winner === 1 ? '玩家 1' : (this.gameMode === 'pve' ? 'AI' : '玩家 2');
            winnerText.textContent = `${winnerName} 获胜！`;
            gameResult.textContent = reason ? `通过 ${reason} 获得胜利！` : '成功连成五子！';
        }
        
        modal.classList.add('show');
    }
    
    restartGame() {
        // 重置游戏状态
        this.board = [];
        this.currentPlayer = 1;
        this.gameOver = false;
        this.roundNumber = 1;
        this.energy = { 1: 1, 2: 1 };
        this.skillCooldowns = {
            1: { feishazoushi: 0, jingruzhishui: 0, libashanxi: 0 },
            2: { feishazoushi: 0, jingruzhishui: 0, libashanxi: 0 }
        };
        this.frozenPlayer = null;
        
        // 重置行动状态
        this.turnActionTaken = false;
        
        // 清空什刹海
        const seaPieces = document.getElementById('sea-pieces');
        if (seaPieces) {
            seaPieces.innerHTML = '';
        }
        
        // 隐藏游戏结束模态框
        document.getElementById('game-over-modal').classList.remove('show');
        
        // 重新初始化
        this.initializeBoard();
        this.renderBoard();
        this.updateUI();
    }
    
    backToMenu() {
        // 隐藏游戏结束模态框
        document.getElementById('game-over-modal').classList.remove('show');
        
        // 重置游戏状态
        this.restartGame();
        
        // 可以在这里添加主菜单逻辑
        this.showMessage('返回主菜单功能待实现');
    }
}

// 游戏初始化
document.addEventListener('DOMContentLoaded', () => {
    window.game = new SkillGomoku();
});