const canvas = document.getElementById("myCanvas");
const CTX = canvas.getContext("2d");
const FPS = 25;

let coins = 100;
let currentBet = null;
let betAmount = 10;
let roundActive = false;
let run = true;

const settings = {
    weaponsPerTeam: 35,
    speedMultiplier: 1,
    weaponSize: 30,
    canvasWidth: 500,
    canvasHeight: 500
};

let scissors = [];
let papers = [];
let rocks = [];

const rock_image = new Image();
const paper_image = new Image();
const scissor_image = new Image();

function loadImages()
{
    rock_image.src = "./rock.png";
    paper_image.src = "./paper.png";
    scissor_image.src = "./scissors.png";
}


function randomNumber() 
{
    const num = Math.random() * 2 - 1;
    if (num === 0) 
        return randomNumber();
    return num;
}

function drawBorder() {
    CTX.beginPath();
    CTX.rect(0, 0, canvas.width, canvas.height);
    CTX.stroke();
}

function placeBet(choice) {
    if (roundActive) return;
    if (coins < betAmount) return;

    currentBet = choice;
    document.getElementById("status").innerText =
        `Bet placed on ${choice.toUpperCase()}`;
}

function resolveBet(winnerElement) {
    if (!currentBet) return;

    const winnerType =
        winnerElement instanceof Rock ? "rock" :
        winnerElement instanceof Paper ? "paper" :
        "scissors";

    if (winnerType === currentBet) {
        coins += betAmount * 2;
        document.getElementById("status").innerText = "YOU WON THE BET!";
    } else {
        coins -= betAmount;
        document.getElementById("status").innerText = "You lost the bet.";
    }

    currentBet = null;
    updateUI();
}


function updateUI() {
    document.getElementById("coins").innerText = `Coins: ${coins}`;
    document.getElementById("team-counts").innerText =
        `Rock: ${rocks.length} | Paper: ${papers.length} | Scissors: ${scissors.length}`;
}

function createElements(quantity) {
    for (let i = 0; i < quantity; i++) {
        scissors.push(new Scissor());
        papers.push(new Paper());
        rocks.push(new Rock());
    }
}

function clampElementsToCanvas() {
    const all = [...scissors, ...papers, ...rocks];
    all.forEach((element) => {
        element.x_pos = Math.max(0, Math.min(canvas.width - element.size, element.x_pos));
        element.y_pos = Math.max(0, Math.min(canvas.height - element.size, element.y_pos));
    });
}

function resizeCanvasToWindow() {
    const horizontalPadding = 40;
    const verticalPadding = 300;
    const maxWidth = Math.max(300, window.innerWidth - horizontalPadding);
    const maxHeight = Math.max(300, window.innerHeight - verticalPadding);
    canvas.width = Math.min(settings.canvasWidth, maxWidth);
    canvas.height = Math.min(settings.canvasHeight, maxHeight);
    clampElementsToCanvas();
}

function sanitizeSettings() {
    settings.weaponsPerTeam = Math.max(1, Math.min(150, Math.floor(settings.weaponsPerTeam)));
    settings.speedMultiplier = Math.max(0.2, Math.min(8, settings.speedMultiplier));
    settings.weaponSize = Math.max(10, Math.min(80, Math.floor(settings.weaponSize)));
    settings.canvasWidth = Math.max(300, Math.min(1200, Math.floor(settings.canvasWidth)));
    settings.canvasHeight = Math.max(300, Math.min(900, Math.floor(settings.canvasHeight)));
}

function syncSettingsInputs() {
    document.getElementById("weaponsPerTeam").value = settings.weaponsPerTeam;
    document.getElementById("weaponSpeed").value = settings.speedMultiplier;
    document.getElementById("weaponSize").value = settings.weaponSize;
    document.getElementById("canvasWidth").value = settings.canvasWidth;
    document.getElementById("canvasHeight").value = settings.canvasHeight;
}

function toggleSettings() {
    document.getElementById("settings-panel").classList.toggle("hidden");
}

function applySettings() {
    settings.weaponsPerTeam = Number(document.getElementById("weaponsPerTeam").value);
    settings.speedMultiplier = Number(document.getElementById("weaponSpeed").value);
    settings.weaponSize = Number(document.getElementById("weaponSize").value);
    settings.canvasWidth = Number(document.getElementById("canvasWidth").value);
    settings.canvasHeight = Number(document.getElementById("canvasHeight").value);

    sanitizeSettings();
    syncSettingsInputs();
    resizeCanvasToWindow();
    Restart();
    document.getElementById("status").innerText = "Settings applied.";
}

function drawElements() {
    scissors.forEach((element) => {
        element.Move();
    });
    rocks.forEach((element) => {
        element.Move();
    });
    papers.forEach((element) => {
        element.Move();
    });
}

function checkCollision(element1, element2) {
    if (
        element1.x_pos < element2.x_pos + element2.size &&
        element1.x_pos + element1.size > element2.x_pos &&
        element1.y_pos < element2.y_pos + element2.size &&
        element1.y_pos + element1.size > element2.y_pos
    ) {
        return true;
    }
}

function checkElementsCollisions() {
    // Scissors beat paper
    scissors.forEach((element1) => {
        papers.forEach((element2) => {
            if (checkCollision(element1, element2)) {
                element2.toScissor();
            }
        });
    });

    // paper beats rock
    papers.forEach((element1) => {
        rocks.forEach((element2) => {
            if (checkCollision(element1, element2)) {
                element2.toPaper();
            }
        });
    });

    // Rock beats scissors
    rocks.forEach((element1) => {
        scissors.forEach((element2) => {
            if (checkCollision(element1, element2)) {
                element2.toRock();
            }
        });
    });
}

function createVelocity() {
    const minSpeed = 1.5;
    const range = 1;
    return randomNumber() * (Math.random() * range + minSpeed) * settings.speedMultiplier;
}

class Element {
    color = "White";
    size = settings.weaponSize;
    img = undefined;

    constructor(x_pos, y_pos, x_dir, y_dir) {
        this.size = settings.weaponSize;
        this.x_pos = typeof x_pos === "number" ? x_pos : Math.random() * (canvas.width - this.size);
        this.y_pos = typeof y_pos === "number" ? y_pos : Math.random() * (canvas.height - this.size);
        this.x_dir = typeof x_dir === "number" ? x_dir : createVelocity();
        this.y_dir = typeof y_dir === "number" ? y_dir : createVelocity();

        this.Draw();
    }

    Draw() {
        if (typeof this.img === "undefined") return;
        CTX.drawImage(this.img, this.x_pos, this.y_pos, this.size, this.size);
    }

    Move() {
        this.Bounce();
        this.x_pos += this.x_dir;
        this.y_pos += this.y_dir;
        this.Draw();
    }

    Bounce() {
        if (this.x_pos + this.x_dir + this.size > canvas.width || this.x_pos + this.x_dir < 0) {
            this.x_dir = -this.x_dir;
        }
        if (this.y_pos + this.y_dir + this.size > canvas.height || this.y_pos + this.y_dir < 0) {
            this.y_dir = -this.y_dir;
        }
    }
}

class Scissor extends Element {
    constructor(x_pos, y_pos, x_dir, y_dir) {
        super(x_pos, y_pos, x_dir, y_dir);
        this.color = "Red";
        this.img = scissor_image;
    }

    toRock() {
        rocks.push(new Rock(this.x_pos, this.y_pos, this.x_dir, this.y_dir));
        scissors.splice(scissors.indexOf(this), 1);
    }
}

class Rock extends Element {
    constructor(x_pos, y_pos, x_dir, y_dir) {
        super(x_pos, y_pos, x_dir, y_dir);
        this.color = "Black";
        this.img = rock_image;
    }

    toPaper() {
        papers.push(new Paper(this.x_pos, this.y_pos, this.x_dir, this.y_dir));
        rocks.splice(rocks.indexOf(this), 1);
    }
}

class Paper extends Element {
    constructor(x_pos, y_pos, x_dir, y_dir) {
        super(x_pos, y_pos, x_dir, y_dir);
        this.color = "Blue";
        this.img = paper_image;
    }

    toScissor() {
        scissors.push(new Scissor(this.x_pos, this.y_pos, this.x_dir, this.y_dir));
        papers.splice(papers.indexOf(this), 1);
    }
}



function drawWinner(element) {
    if (element === undefined) return;

    CTX.fillStyle = "black";
    CTX.fillRect((canvas.width / 2) - 80, canvas.height / 2 - 20, 180, 45);

    CTX.fillStyle = "White";
    CTX.font = "48px Arial";
    CTX.textAlign = "center";
    CTX.fillText("Wins!!", canvas.width / 2 + 25, canvas.height / 2 + 20);
    CTX.drawImage(element.img, (canvas.width / 2 + 25) - 105, canvas.height / 2 - 13, 30, 30);
}

function checkWin() {
    if (scissors.length === 0 && papers.length === 0) return rocks[0];
    if (rocks.length === 0 && scissors.length === 0) return papers[0];
    if (rocks.length === 0 && papers.length === 0) return scissors[0];
    return undefined;
}

function start() {
    scissors = [];
    papers = [];
    rocks = [];
    createElements(settings.weaponsPerTeam);
    roundActive = true;
    updateUI();
}

function pause() {
    run = !run;
}

function Restart() {
    scissors = [];
    papers = [];
    rocks = [];
    roundActive = false;
    start();
}

window.addEventListener("resize", resizeCanvasToWindow);
window.addEventListener("keydown", function () { run = !run; }, false);

loadImages();
sanitizeSettings();
syncSettingsInputs();
resizeCanvasToWindow();
updateUI();

function animate() {
    if (!run) return;

    // Clear the background
    CTX.clearRect(0, 0, canvas.width, canvas.height);

    drawElements();
    drawBorder();

    checkElementsCollisions();
    let winner = checkWin();
    if (winner) {
        resolveBet(winner);
        drawWinner(winner);
        roundActive = false;
    }
    updateUI();
}

setInterval(animate, FPS);
