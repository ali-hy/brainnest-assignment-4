const calculatorDisplayDiv = document.querySelector(".calculator-display");
var calculatorDisplay = "";
var previousResult;

// ---- Utility functions ----
function arrayBack(arr){
  if(arr.length > 0){
    return arr[arr.length - 1];
  }
  return undefined;
}
function arrayFront(arr){
  return arr[0];
}
/**
 * @param {string | Array} arr 
 * @param {any} toBeFound 
 */
function count(toBeFound, arr){
  if(typeof arr === 'string'){
    arr = arr.split('');
  }
  return arr.reduce((count, value) => value === toBeFound ? count+1 : count);
}

// ---- Dictionaries ----
const operationInfo = {
  '-':{
    display: '−',
    basicFunction: (a,b) => a + b,
  },
  '/': {
    display: '÷',
    basicFunction: (a,b) => a / b,
  },
  '*': {
    display: '×',
    basicFunction: (a,b) => a * b,
  },
  '+': {
    display: '+',
    basicFunction: (a,b) => a + b,
  }
}

// ---- Calculator Expression ----
const calculatorExpression = [];

function makeNumberToken(n){
  return {
    type: 'value',
    valueType: 'number',
    text: String(n),
    getValue: () => {
      return Number.parseFloat(this.text);
    }
  }
}

function makeOperationToken(operation){
  return{
    type: 'operation',
    text: operation,
    displayCharacter: operationInfo[operation].display,
    basicFunction: operationInfo[operation].basicFunction
  }
}

function pushNumberToExpression(n){
  calculatorExpression.push(makeNumberToken(n));
  console.log(`added ${n} to calculatorExpression -> `, calculatorExpression);
}

function pushAnsToExpression(n){
  return {
    type: 'value',
    valueType: 'variable',
    text: String(n),
    getValue: () => {
      return previousResult;
    }
  }
}

function pushOperationToExpression(operation){
  calculatorExpression.push(makeOperationToken(operation));
}

function pushDigitToExpression(digit){
  const expressionEnd = arrayBack(calculatorExpression);

  if(expressionEnd === undefined || expressionEnd.type !== "value"){
    pushNumberToExpression(digit);
    return;
  }
  expressionEnd.text += digit;
}

const validateNumber = (numToken) => {
  return count('.', numToken.text) <= 1;
}

function validateExpression(){
  var nextType = "value";
  for(const current of calculatorExpression){
    if(current.type !== nextType){
      current.syntaxError = `Expecteda a(n) ${nextType}`;
      return;
    }
    nextType = nextType === "value" ? "operation" : "value";
  }
}

pushDigitToExpression('2');
pushDigitToExpression('4')
pushOperationToExpression('+');
pushDigitToExpression('3');
pushOperationToExpression('-');
pushOperationToExpression('+');

validateExpression();

function updateCalculatorDisplay(){
  calculatorDisplayDiv.textContent = calculatorDisplay;
}

function clearDisplay(){
  calculatorDisplay = "";
  updateCalculatorDisplay();
}

function inputDel(){
  calculatorDisplay = calculatorDisplay.slice(0, -1);
  updateCalculatorDisplay();
}

function inputFn(input){
  return () => {
    calculatorDisplay += input;
    updateCalculatorDisplay();
  }
}

function keyToButton(buttonParent){
  return (key) => {
    if(key.callBackFn === undefined){
      key.callBackFn = inputFn(key.text);
    }
    if(key.keydownChecks === undefined){
      key.keydownChecks = new Set([key.text]);
    }
    if(key.idText === undefined){
      key.idText = key.text.toLowerCase();
    }

    const btn = document.createElement('button');
    btn.id = 'key-'+key.idText;
    btn.textContent = key.text;
    buttonParent.appendChild(btn);
  
    btn.addEventListener('click', key.callBackFn);
    if(key.additionalClasses) btn.classList.add(...key.additionalClasses);

    window.addEventListener('keydown', (event) => {
      // console.log(key.keydownChecks)
      if(key.keydownChecks.has(event.key.toLowerCase())){
        // console.log(event.key)
        key.callBackFn();
      } 
    });
    
    return btn;
  }
}

const numPad = document.querySelector(".num-pad");
const numberPadKeys = [{
  text: '7',
  additionalClasses: ['top-left']
},{
  text: '8',
},{
  text: '9',
},{
  text: '4',
},{
  text: '5',
},{
  text: '6',
},{
  text: '1',
},{
  text: '2',
},{
  text: '3',
},{
  text: '0',
  additionalClasses: ['bottom-left']
},{
  text: '.',
  idText: 'decimal-point',
  additionalClasses: ['bold']
},{
  text: 'Ans',
  keydownChecks: new Set(['a'])
}];
const numberPadButtons = numberPadKeys.map(keyToButton(numPad));

const operationPad = document.querySelector(".operation-pad");
const operationPadKeys = [{
  text: 'DEL',
  callBackFn: inputDel,
  keydownChecks: new Set(['backspace','delete']),
  additionalClasses: ['deletion-btn']
},{
  text: 'C',
  callBackFn: clearDisplay,
  keydownChecks: new Set('c'),
  additionalClasses: ['deletion-btn', 'top-right']
},{
  text: '+',
  idText: 'add',
  callBackFn: inputFn(' + '),
},{
  text: '−',
  idText: 'sub',
  callBackFn: inputFn(' - ')
},{
  text: '÷',
  idText: 'div',
  callBackFn: inputFn(' ÷ ')
},{
  text: '×',
  idText: 'mult',
  callBackFn: inputFn(' × ')
},{
  text: '=',
  idText: 'eq',
  callBackFn: operate,
  keydownChecks: new Set(['enter', '=']),
  additionalClasses: ['bottom-right']
}]
const operationPadButtons = operationPadKeys.map(keyToButton(operationPad));

function operate(operation, a, b){

}