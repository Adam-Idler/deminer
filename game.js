const canvas = document.getElementById('game-field');
const ctx = canvas.getContext('2d');
const cells = [];
const bombs = [];
const cellsView = [];
const bombsView = [];
let activeBombImage;

const cellSize = 40;
const fieldSize = 6;

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

// const map = [
//   [0, 0, 0, 0, 0, 0, 0, 0],
//   [1, 0, 0, 0, 0, 0, 0, 0],
//   [0, 0, 0, 1, 0, 1, 0, 0],
//   [0, 0, 0, 0, 0, 0, 0, 0],
//   [1, 0, 0, 0, 0, 0, 0, 1],
//   [0, 0, 0, 0, 0, 0, 0, 0],
//   [0, 1, 0, 1, 0, 0, 0, 1],
//   [0, 0, 0, 0, 0, 0, 0, 0]
// ];

function getRandomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const map = [];
for (let i = 0; i < fieldSize; i++) {
  map[i] = [];
  for (let j = 0; j < fieldSize; j++) {
    map[i][j] = 0;
  }
}

for (let i = 0; i < 5; i++) {
  map[getRandomInRange(0, fieldSize - 1)][getRandomInRange(0, fieldSize - 1)] = 1;
}

class Cell {
  constructor({ x, y, width, height, i, j, blockImg, bombImg,  opened = false }) {
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
  if (!cell || cell.opened || cell.bombsAround > 0) return;

  if (cell.isBomb) {
    cell.bombImg = activeBombImage;
    bombs.forEach(bomb => {
      canvas.removeEventListener('click', canvasClickHandler);
      bomb.opened = true;
      bomb.draw();
    });
  } else {
    cell.opened = true;
    applyFunctionToCellsAround(cells, openEmptyBlock, cell);
    applyFunctionToCellsAround(cells, forceOpenBlock, cell);
  }
}

function forceOpenBlock(cell) {
  if (!cell) return;
  cell.opened = true;
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
  console.log(remainingBlocks);
  if (remainingBlocks.length - bombs.length === 0) {
    console.log('Победа!!');
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

function canvasClickHandler(e) {
  let x = e.pageX - canvasLeft;
  let y = e.pageY - canvasTop;

  cells.forEach(cell => {
    if (y > cell.y && y < cell.y + cell.height
      && x > cell.x && x < cell.x + cell.width) {
      // console.log('clicked an element', cell.mapI, cell.mapJ);

      openEmptyBlock(cell);
      forceOpenBlock(cell);
      // applyFunctionToCellsAround(cells, openEmptyBlock, cell);

      draw();
    }
  });
}

canvas.addEventListener('click', canvasClickHandler);
