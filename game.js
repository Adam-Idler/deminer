const canvas = document.getElementById('game-field');
const modalWrapper = document.querySelector('.modal__wrapper');
const modalWin = document.querySelector('.modal_win');
const modalLoss = document.querySelector('.modal_loss');
const modalRetryButton = document.querySelector('.modal__retry-button');
const link = document.querySelector("link[rel~='icon']");

const ctx = canvas.getContext('2d');
const cells = [];
const bombs = [];
const cellsView = [];
const bombsView = [];
const map = [];
let activeBombImage;

const cellSize = 40;
const fieldSize = 10;

canvas.width = fieldSize * cellSize * 2 + 40;
canvas.height = fieldSize * cellSize + 20;
canvasLeft = canvas.offsetLeft;
canvasTop = canvas.offsetTop;

const cellStyle = {
  0: () => { },
  1: () => { ctx.fillStyle = '#fff' },
  2: () => { ctx.fillStyle = 'green' },
  3: () => { ctx.fillStyle = 'yellow' },
  4: () => { ctx.fillStyle = 'orange' },
  5: () => { ctx.fillStyle = 'red' },
  6: () => { ctx.fillStyle = 'violet' },
  bomb: (_this, bombImg) => {
    ctx.drawImage(bombImg, _this.x + 3, _this.y + 3, _this.width - 6, _this.height - 6);
    ctx.fillStyle = 'transparent';
  },
  default: () => { ctx.fillStyle = 'black' }
}

function getRandomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

class Cell {
  constructor({ x, y, width, height, i, j, blockImg, bombImg, opened = false }) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.mapI = i;
    this.mapJ = j;
    this.isBomb = !!map[this.mapI][this.mapJ];
    this.bombsAround = 0;
    this.blockImg = blockImg;
    this.bombImg = bombImg;
    this.opened = opened;
  }

  drawCell() {
    ctx.fillStyle = '#6f3e43';
    ctx.strokeStyle = '#bbabab';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    if (!this.isBomb) {
      cellStyle[this.bombsAround]();
    } else if (this.isBomb) {
      cellStyle['bomb'](this, this.bombImg);
    } else {
      cellStyle['default']();
    }

    ctx.font = '30px Teletactile';
    ctx.fillText(this.bombsAround, this.x + cellSize / 4.2, this.y + cellSize / 1.3);
  }

  drawBlock() {
    ctx.drawImage(this.blockImg, this.x, this.y, this.width, this.height);
  }

  draw() {
    if (this.opened) {
      this.drawCell();
    } else {
      this.drawBlock();
    }
  }
}

function applyFunctionToCellsAround(cells, fn, cell) {
  const result = [];
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (
        i === 0 && j === 0 ||
        cell.mapI + i > fieldSize - 1 || cell.mapI + i < 0 ||
        cell.mapJ + j > fieldSize - 1 || cell.mapJ + j < 0
      ) continue;
      result.push(fn(cells[fieldSize * (cell.mapI + i) + cell.mapJ + j]));
    }
  }
  return result;
}

function increaseBombsAround(cell) {
  if (!cell) return;
  cell.bombsAround++;
}

function openEmptyBlock(cell) {
  if (!cell || cell.opened || cell.isBomb || cell.bombsAround > 0) return;

  cell.opened = true;
  applyFunctionToCellsAround(cells, openEmptyBlock, cell);
  applyFunctionToCellsAround(cells, forceOpenBlock, cell);
}

function forceOpenBlock(cell) {
  if (!cell) return;
  cell.opened = true;

  if (cell.isBomb) {
    openModal(modalLoss);
    link.href = './assets/img/active-bomb.png';
    cell.bombImg = activeBombImage;
    bombs.forEach(bomb => {
      bomb.opened = true;
      bomb.draw();
    });
  }
}

function draw() {
  ctx.fillStyle = '#6f3e43';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // ctx.clearRect(0, 0, canvas.width, canvas.height);

  cells.forEach(cell =>
    cell.draw()
  );
  cellsView.forEach(cell =>
    cell.draw()
  );

  const remainingBlocks = cells.filter(cell => !cell.opened);
  if (remainingBlocks.length - bombs.length === 0) {
    openModal(modalWin);
  }
}


function loadFont(font) {
  return new Promise((resolve, reject) => {
    font.load().then(() => resolve(font));
  })
}

function loadImage(url) {
  return new Promise((fulfill, reject) => {
    let imageObj = new Image();
    imageObj.src = url;
    imageObj.onload = () => fulfill(imageObj);
  });
}

function start() {
  for (let i = 0; i < fieldSize; i++) {
    map[i] = [];
    for (let j = 0; j < fieldSize; j++) {
      map[i][j] = 0;
    }
  }

  for (let i = 0; i < 14; i++) {
    let randomI = getRandomInRange(0, fieldSize - 1);
    let randomJ = getRandomInRange(0, fieldSize - 1);
    if (map[randomI][randomJ] === 1) {
      i--;
      continue;
    }
    map[randomI][randomJ] = 1;
  }

  Promise.all([
    loadFont(new FontFace('Teletactile', 'url(./assets/fonts/Teletactile.ttf)')),
    loadImage('./assets/img/character_0008.png'),
    loadImage('./assets/img/tile_0047.png'),
    loadImage('./assets/img/active-bomb.png'),
  ])
    .then(([font, bombImg, blockImg, activeBombImg]) => {
      document.fonts.add(font);
      activeBombImage = activeBombImg;

      for (let i = 0; i < fieldSize; i++) {
        for (let j = 0; j < fieldSize; j++) {
          cells.push(new Cell({
            x: j * cellSize + 10,
            y: i * cellSize + 10,
            width: cellSize,
            height: cellSize,
            i,
            j,
            blockImg,
            bombImg
          }));
        }
      }

      for (let i = 0; i < fieldSize; i++) {
        for (let j = 0; j < fieldSize; j++) {
          cellsView.push(new Cell({
            x: j * cellSize + canvas.width / 2 + 10,
            y: i * cellSize + 10,
            width: cellSize,
            height: cellSize,
            i,
            j,
            blockImg,
            bombImg,
            opened: true
          }));
        }
      }

      cells.forEach(cell => {
        if (cell.isBomb) {
          bombs.push(cell);
          applyFunctionToCellsAround(cells, increaseBombsAround, cell);
        }
      });

      cellsView.forEach(cell => {
        if (cell.isBomb) {
          bombsView.push(cell);
          applyFunctionToCellsAround(cellsView, increaseBombsAround, cell);
        }
      });

      draw();
    });
  
  canvas.addEventListener('click', canvasClickHandler);
}

function openModal(modal) {
  canvas.removeEventListener('click', canvasClickHandler);
  modalWrapper.classList.add('visible');
  modal.classList.add('visible');
}

function closeModal(modal) {
  modalWrapper.classList.remove('visible');
  modalWrapper.querySelector('.visible').classList.remove('visible');
}

function canvasClickHandler(e) {
  let x = e.pageX - canvasLeft;
  let y = e.pageY - canvasTop;

  cells.forEach(cell => {
    if (y > cell.y && y < cell.y + cell.height
      && x > cell.x && x < cell.x + cell.width) {
      openEmptyBlock(cell);
      forceOpenBlock(cell);

      draw();
    }
  });
}
start();

modalRetryButton.addEventListener('click', () => {
  map.length = 0;
  cells.length = 0;
  cellsView.length = 0;
  bombs.length = 0;
  closeModal();
  link.href = './assets/img/character_0008.png';

  start()
});
