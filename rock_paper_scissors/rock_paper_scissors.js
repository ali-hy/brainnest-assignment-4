var playerScore = 0, 
  computerScore = 0;
const maximumScore = 5;

const iconPath = "./icons/";
const moves = ["rock", "paper", "scissors"];
const moveNumbersMap = {
  rock: 0,
  paper: 1,
  scissors: 2
}
const selectedMoveNumber = {
  player: 0,
  computer: 0
}

const playerScoreSpans = document.querySelectorAll('.player-score');
const computerScoreSpans = document.querySelectorAll('.computer-score');

const hands = document.querySelectorAll('.hand');
const playerHand = document.querySelector('img#player-hand');
const computerHand = document.querySelector('img#computer-hand');

const moveBtns = document.querySelectorAll('.move-btn');
const rockBtn = document.querySelector("#rock-btn");
const paperBtn = document.querySelector("#paper-btn");
const scissorsBtn = document.querySelector("#scissors-btn");

function disableMoveBtns(){
  moveBtns.forEach((btn) => {
    btn.disabled = true;
  })
}
function enableMoveBtns(){
  moveBtns.forEach((btn) => {
    btn.disabled = false;
  })
}

function getMoveIconPath(move){
  switch(typeof move){
    case 'number':
      return iconPath + moves[move] + '.png';
    case 'string':
      return iconPath + move + '.png';
    default:
      throw("Invalid input to getMoveIconPath. Type of `move`"
      + "can only be string or number. Type of move: " + typeof move);
  }
}
function getMoveNumber(selectedMove){
  return moveNumbersMap[selectedMove];
}

function playerPlay(moveNumber){
  selectedMoveNumber.player = moveNumber;
}
function computerPlay(){
  const numberSelected = Math.floor(Math.random() * 3);
  selectedMoveNumber.computer = numberSelected;
}
function playRoundAnimation(){
  hands.forEach(hand => {
    hand.setAttribute('src', getMoveIconPath('rock'));
    hand.classList.add("animate");
    hand.addEventListener('animationend', handAnimationEndHandler);
  });
  playerHand.addEventListener('animationend', displayRoundEvaluation);
}

function startRoundFn(moveNumber){
  return () => {
    disableMoveBtns();
    playerPlay(moveNumber);
    computerPlay();
    playRoundAnimation();
  }
}

function handAnimationEndHandler(event){
  const target = event.target;
  var handReference;
  if(target == playerHand){
    handReference = 'player';
  } else if (target == computerHand){
    handReference = 'computer';
  } else {
    throw("handAnimationEndHandler should only be used for "
    + "elements with the `hand` class")
  }
  target.setAttribute('src', getMoveIconPath(selectedMoveNumber[handReference]));
  target.classList.remove('animate');
  if(getGameStatus() === 'ongoing')
    enableMoveBtns();
}

function playRound(){
  const moveDifference = selectedMoveNumber.player - selectedMoveNumber.computer;

  if(moveDifference == 1 || moveDifference == -2) {
    playerScore++;
    return `You win! ${moves[selectedMoveNumber.player]} beats ${moves[selectedMoveNumber.computer]}!`;
  } else if(moveDifference == 0) {
    return `Draw! Both you and the computer played ${moves[selectedMoveNumber.player]}`;
  } else {
    computerScore++;
    return `You lost! ${moves[selectedMoveNumber.computer]} beats ${moves[selectedMoveNumber.player]}!`;
  }
}

function clearRoundEvaluation(){
  const playingArea = document.querySelector('div.playing-area');
  var currentMessage = playingArea.querySelector('div.round-evaluation');
  playingArea.removeChild(currentMessage);
}

function displayRoundEvaluation(){
  const playDisplay = document.querySelector('div.playing-area');
  var currentMessage = playDisplay.querySelector('div.round-evaluation');
  if(currentMessage == null){
    currentMessage = document.createElement('div');
    currentMessage.classList.add("round-evaluation");
    playDisplay.appendChild(currentMessage);
  }
  currentMessage.textContent = playRound();
  updateScoresDisplay();
  checkGameEnded();
}

function updateScoresDisplay(){
  playerScoreSpans.forEach(span => {
    span.textContent = playerScore;
  })
  computerScoreSpans.forEach(span => {
    span.textContent = computerScore;
  })
}

function getGameStatus(){
  if(playerScore === maximumScore){
    return 'win';
  } else if(computerScore === maximumScore){
    return 'loss';
  } else {
    return 'ongoing';
  }
}

function showEndGameScreen(gameStatus){
  const endGameScreen = document.querySelector('.endgame-screen');
  endGameScreen.classList.add(gameStatus);

  const endGameMessage = endGameScreen.querySelector("h1");

  if(gameStatus === "win"){
    endGameMessage.textContent = "you win!";
  } else if (gameStatus === "loss"){
    endGameMessage.textContent = "gameover!"
  }
}

function hideEndGameScreen(){
  const endGameScreen = document.querySelector('.endgame-screen');
  endGameScreen.classList.remove("win", "loss");
}

function checkGameEnded(){
  const gameStatus = getGameStatus();
  if(gameStatus === 'ongoing') return;
  disableMoveBtns();
  setTimeout(showEndGameScreen, 1000, gameStatus);
}

function resetHands(){
  hands.forEach(hand => {
    hand.setAttribute('src', getMoveIconPath('rock'));
  })
}

function resetPlayingArea(){
  resetHands();
  clearRoundEvaluation();
}

function resetScores(){
  playerScore = 0;
  computerScore = 0;
}

function restartGame(){
  resetScores();
  updateScoresDisplay();
  hideEndGameScreen();
  resetPlayingArea();
  enableMoveBtns();
}

function initGame(){
  moveBtns.forEach((moveBtn, index) => {
    moveBtn.addEventListener('click', startRoundFn(index));
  })
  const playAgainBtn = document.querySelector("button#play-again-btn");
  playAgainBtn.addEventListener('click',restartGame);
}

initGame();