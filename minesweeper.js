let ROWS ;
let COLS;
let SIZE = 24;
let canvas = document.getElementById('canvas');
let restartButton = document.getElementById('restart');

let failedBombKey
let cells
let revealedKeys
let flaggedKeys
let map

function toKey(row, col) {
    return row + '-' + col;
}

function fromKey(key) {
    return key.split('-').map(Number)
}

function createButton() {
    canvas.style.width = ROWS * SIZE + 'px';
    canvas.style.height = COLS * SIZE + 'px';
    for (let i = 0; i<ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            let cell = document.createElement('button');
            cell.style.float = 'left'
            cell.style.width = SIZE + 'px';
            cell.style.height = SIZE + 'px';
            cell.oncontextmenu = (e) => {
                if (failedBombKey !== null) {
                   return
                }
                e.preventDefault();
                toggleFlag(key)
                updateButtons()
            }
            cell.onclick = (e) => {
                if (failedBombKey !== null) {
                   return
                }
                if (flaggedKeys.has(key)) {
                    return
                }

                revealCell(key);
                updateButtons();
            }
            canvas.appendChild(cell);
            let key = toKey(i, j);
            cells.set(key, cell)
        }
    }
    restartButton.onclick = startGame;
}

function startGame() {
    failedBombKey = null;
    revealedKeys = new Set();
    flaggedKeys = new Set();
    map = generateMap(generateBombs());
    if (cells) {
        updateButtons();
    } else {
        cells = new Map();
        createButton();
    }
}

function updateButtons() {
    for (let i = 0; i<ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            let key = toKey(i, j);
            let cell = cells.get(key);

            cell.disabled = false;
            cell.textContent = '';
            cell.style.backgroundColor = '';
            cell.style.color = 'black';

            let value = map.get(key);
            if(failedBombKey !== null && value === 'bomb') {
                cell.disabled = true;
                cell.textContent = `💣`
                cell.style.backgroundColor = ''
                cell.style.padding = '0px'
                if (key === failedBombKey) {
                    cell.style.backgroundColor = 'red'
                }

            } else if (revealedKeys.has(key)) {
                cell.disabled = true;
                if (value === undefined) {
                    // leave it as is
                } else if (value === 1) {
                    cell.textContent = '1';
                    cell.style.color = 'blue';
                } else if (value === 2) {
                    cell.textContent = '2';
                    cell.style.color = 'green';
                } else if (value >= 3) {
                    cell.textContent = '3';
                    cell.style.color = 'red';
                } else if (value === 'bomb') {
                    cell.textContent = `💣`
                    cell.style.backgroundColor = 'red'
                    cell.style.padding = '0px'  
                } else {
                    throw Error('should never happen')
                }
            } else if (flaggedKeys.has(key)) {
                cell.textContent = '🚩';
            }
        }
    }
    if (failedBombKey !== null) {
        canvas.style.pointerEvents = 'none'
        restartButton.style.display = 'block'
    } else {
        canvas.style.pointerEvents = ''
        restartButton.style.display = ''   
    }
}

function toggleFlag(key) {
    if(flaggedKeys.has(key)) {
        flaggedKeys.delete(key)
    } else {
        flaggedKeys.add(key)
    }
}

function revealCell(key) {
    if (map.get(key) === 'bomb') {
        failedBombKey = key
    } else {
        propagateReveal(key, new Set())
    }
}

function propagateReveal(key, visited) {
    revealedKeys.add(key)
    visited.add(key)
    let isEmpty = !map.has(key)
    if (isEmpty) {
        for (let neighborKey of getNeighbors(key)) {
            if (!visited.has(neighborKey)) {
                propagateReveal(neighborKey, visited)
            }
        }
    }
}

function isInBounds([ row, col]) {
    if (row < 0 || col < 0) {
        return false
    } 
    if (row >= ROWS || col >= COLS) {
        return false
    }
    return true
}

function getNeighbors(key) {
    let [row, col] = fromKey(key)
    let neighborsRowCols = [
        [row - 1, col - 1],
        [row - 1, col],
        [row - 1, col + 1],
        [row, col - 1],
        [row, col + 1],
        [row + 1, col - 1],
        [row + 1, col],
        [row + 1, col + 1],
    ]
    return neighborsRowCols.filter(isInBounds).map(([r, c]) => toKey(r, c))
}

function generateBombs() {
    let count = Math.round(1/9*ROWS*COLS);
    var el = document.getElementById('info');
    if (el !== null) {
        el.remove();
    }
    const newDiv = document.createElement("div");
    newDiv.setAttribute("id", "info");
    const newContent = document.createTextNode(`There are ${count} bombs to diffuse. In order to win, you need to find all the cells without bombs inside. Good luck!`);
    newDiv.appendChild(newContent);
    document.body.insertBefore(newDiv, canvas);

    let bombs = []
    let allKeys = []
    for (let i = 0; i<ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            allKeys.push(toKey(i, j))
        }
    }
    allKeys.sort(()=> {
        let coinFlip = Math.random() > 0.5
        return coinFlip ? 1 : -1
    })
    return allKeys.slice(0, count)
}

function generateMap(seedBombs) {
    let map = new Map()

    function incrementDanger(neighborKey) {
        if (!map.has(neighborKey)) {
            map.set(neighborKey, 1);
        } else {
            let oldVal = map.get(neighborKey)
            if (oldVal !== 'bomb') {
                map.set(neighborKey, oldVal + 1)
            }
        }
    }
    for (let key of seedBombs) {
        map.set(key, 'bomb');
        for (let neighborKey of getNeighbors(key)) {
            incrementDanger(neighborKey)
        }
    }
    return map
}

function runTheGame(){
    ROWS = document.getElementById('rows').value;
    COLS = document.getElementById('cols').value;
    let formData = document.getElementById('form');
    formData.style.display = 'none'
    canvas.style.display = ''
    startGame();
}

start.onclick = runTheGame;

