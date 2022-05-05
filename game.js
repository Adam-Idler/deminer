const canvas = document.getElementById('game-field');
const modalWrapper = document.querySelector('.modal__wrapper');
const modalWin = document.querySelector('.modal_win');
const modalLoss = document.querySelector('.modal_loss');
const modalRetryButton = document.querySelector('.modal__retry-button');
const flagBtn = document.querySelector('.flag');
const link = document.querySelector("link[rel~='icon']");
const timerMinutes = document.querySelector('#timer-minutes');
const timerSeconds = document.querySelector('#timer-seconds');
const recordText = document.querySelector('.record');

const ctx = canvas.getContext('2d');
const cells = [];
const bombs = [];
const map = [];
let activeBombImage;
let intervalID;
let isFirstClick = true;
let time = 0;

const cellSize = 40;
const fieldSize = 10;
const bombsCount = 15;

canvas.width = fieldSize * cellSize + 20;
canvas.height = fieldSize * cellSize + 20;
canvasLeft = canvas.offsetLeft;
canvasTop = canvas.offsetTop;

function getRandomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
  if (
    !cell ||
    cell.opened ||
    cell.isBomb ||
    cell.bombsAround > 0 ||
    document.body.classList.contains('flaged')
  ) return;

  if (cell.flaged) {
    cell.flaged = false;
    return;
  }

  cell.opened = true;
  applyFunctionToCellsAround(cells, openEmptyBlock, cell);
  applyFunctionToCellsAround(cells, forceOpenBlock, cell);
}

function forceOpenBlock(cell) {
  if (!cell) return;

  if (document.body.classList.contains('flaged')) {
    cell.flaged = !cell.flaged;
    document.body.classList.remove('flaged');

    return;
  }

  if (!cell.flaged) {
    cell.opened = true;

    if (cell.isBomb) {
      openModal(modalLoss);
      cancelTimer();
      link.href = './assets/img/active-bomb.png';
      cell.bombImg = activeBombImage;
      bombs.forEach(bomb => {
        bomb.opened = true;
        bomb.draw();
      });
    }
  }
}

const getNullAdd = (param) => {
  if (param < 10) {
    return '0' + param;
  } else {
    return param
  }
}

const getTime = (time) => {
  let minutes = getNullAdd(Math.floor((time / 60) % 60));
  let seconds = getNullAdd(Math.floor(time % 60));
  return { minutes, seconds }
}

function timer() {
  const updateClock = () => {
    time += 1;
    let timeNow = getTime(time);
    timerMinutes.textContent = timeNow.minutes;
    timerSeconds.textContent = timeNow.seconds;
  }

  intervalID = setInterval(updateClock, 1000);
  updateClock();
}

function cancelTimer() {
  clearInterval(intervalID);
}

function openModal(modal) {
  canvas.removeEventListener('click', canvasClickHandler);
  modalWrapper.classList.add('visible');
  modal.classList.add('visible');
}

function closeModal() {
  modalWrapper.classList.remove('visible');
  modalWrapper.querySelector('.visible').classList.remove('visible');
}

function canvasClickHandler(e) {
  let x = e.pageX - canvasLeft;
  let y = e.pageY - canvasTop;

  if (isFirstClick) {
    timer();
  }
  isFirstClick = false;

  cells.forEach(cell => {
    if (y > cell.y && y < cell.y + cell.height
      && x > cell.x && x < cell.x + cell.width) {
      openEmptyBlock(cell);
      forceOpenBlock(cell);

      draw();
    }
  });
}

function flagHandler() {
  document.body.classList.toggle('flaged');
}

function draw() {
  ctx.fillStyle = '#6f3e43';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  cells.forEach(cell =>
    cell.draw()
  );

  const remainingBlocks = cells.filter(cell => !cell.opened);
  if (remainingBlocks.length - bombs.length === 0) {
    cancelTimer();
    let lastRecord = +localStorage.getItem('record');
    console.log(recordText);
    time
    if (time < lastRecord || !lastRecord) {
      localStorage.setItem('record', time);
      console.log(timerMinutes.textContent, timerSeconds.textContent);
      recordText.textContent = `New Record: ${timerMinutes.textContent}:${timerSeconds.textContent}`;
    } else {
      let lastRecordTime = getTime(lastRecord);
      recordText.textContent = `Record: ${lastRecordTime.minutes}:${lastRecordTime.seconds}`;
    }

    bombs.forEach(bomb => {
      bomb.opened = true;
      bomb.draw();
    });
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

  for (let i = 0; i < bombsCount; i++) {
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
    loadImage('./assets/img/tile_0111.png')
  ])
    .then(([font, bombImg, blockImg, activeBombImg, flagImg]) => {
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
            bombImg,
            flagImg
          }));
        }
      }

      cells.forEach(cell => {
        if (cell.isBomb) {
          bombs.push(cell);
          applyFunctionToCellsAround(cells, increaseBombsAround, cell);
        }
      });

      draw();
    });

  canvas.addEventListener('click', canvasClickHandler);
}

const cellStyle = {
  0: () => { ctx.fillStyle = 'transparent' },
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

class Cell {
  constructor({ x, y, width, height, i, j, blockImg, bombImg, flagImg, opened = false, flaged = false }) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.mapI = i;
    this.mapJ = j;
    this.isBomb = !!map[this.mapI][this.mapJ];
    this.flaged = flaged;
    this.bombsAround = 0;
    this.blockImg = blockImg;
    this.bombImg = bombImg;
    this.flagImg = flagImg;
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

  drawFlag() {
    ctx.drawImage(this.flagImg, this.x + 10, this.y + 10, this.width - 20, this.height - 20);
  }

  draw() {
    if (this.opened) {
      this.drawCell();
    } else {
      this.drawBlock();
      if (this.flaged) this.drawFlag();
    }
  }
}

start();

flagBtn.addEventListener('click', flagHandler);
document.addEventListener('contextmenu', (e) => e.preventDefault())
document.addEventListener('mousedown', (e) => { if (e.button === 2) flagHandler() });

modalRetryButton.addEventListener('click', () => {
  isFirstClick = true;
  timerMinutes.textContent = '00';
  timerSeconds.textContent = '00';
  time = 0;
  map.length = 0;
  cells.length = 0;
  bombs.length = 0;
  closeModal();
  link.href = './assets/img/character_0008.png';

  start()
});
