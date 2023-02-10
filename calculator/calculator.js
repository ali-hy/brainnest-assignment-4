const calculatorDisplayDiv = document.querySelector(".calculator-display");

const calculatorInputDiv = document.querySelector(".calculator-input");
const calculatorOutputDiv = document.querySelector(".calculator-output");
var previousResult;
/**
 * @type {'writing' | 'evaluated' | 'error'}
 */
var calculatorState = 'writing';

const calculatorHistory = [];

// ---- Utility functions ----
/**
 * @param {Array} arr 
 * @returns member at end of array 
 */
function arrayBack(arr){
  if(arr.length > 0){
    return arr[arr.length - 1];
  }
  return undefined;
}
/**
 * @param {Array} arr 
 * @returns first member of the array
 */
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
/**
 * @param {Array} array 
 * @param {(element, index:number, array:Array) => boolean} callBackFn 
 */
function findLastIndex(array, callBackFn){
  let i;
  for(i = array.length - 1; i >= 0; i++){
    const currentElement =  array[i];
    if(callBackFn(currentElement, i, array)){
      break;
    }
  }
  return i;
}

// ---- Dictionaries ----
const operationInfo = {
  '-':{
    text: '−',
    basicFunction: (a,b) => a + b,
    priority: 1,
  },
  '/': {
    text: '÷',
    basicFunction: (a,b) => {
      if(b === 0) return makeError('Math Error', 'Division by zero not allowed');
      return a / b;
    },
    priority: 1,
  },
  '*': {
    text: '×',
    basicFunction: (a,b) => a * b,
    priority: 0,
  },
  '+': {
    text: '+',
    basicFunction: (a,b) => a + b,
    priority: 0,
  }
}

// ---- Calculator Expression ----
const calculatorExpression = [];

function makeNumberToken(n){
  return {
    type: 'value',
    valueType: 'number',
    text: String(n),
    getValue: function() {
      return Number.parseFloat(this.text);
    }
  }
}

function makeOperationToken(operation){
  return{
    type: 'operation',
    ... operationInfo[operation]
  }
}

function pushNumberToExpression(n){
  calculatorExpression.push(makeNumberToken(n));
}

function pushAnsToExpression(){
  calculatorExpression.push({
    type: 'value',
    valueType: 'variable',
    text: 'Ans',
    getValue: () => {
      return previousResult;
    }
  })
}

function pushOperationToExpression(operation){
  if(calculatorExpression.length === 0){
    pushNumberToExpression('0');
  }
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

const numberTokenIsValid = (numToken) => {
  return count('.', numToken.text) <= 1;
}

function validateLastToken(lastToken, prev){

}

function validateExpression(){
  var nextType = "value";
  for(const currentToken of calculatorExpression){
    if(currentToken.type !== nextType){
      currentToken.syntaxError = `Expected a(n) ${nextType}`;
      return;
    }
    if(currentToken.valueType === "number"){
      if(numberTokenIsValid(currentToken))
        (currentToken.syntaxError = "Numbers can't have more than one decimal point");
    }
    nextType = nextType === "value" ? "operation" : "value";
  }
}

function updateCalculatorDisplay(){
  calculatorDisplayDiv.textContent = calculatorExpression.map(token => token.text).join(' ');
}

function tokenToHTMLSpan(token){
  const spanElement = document.createElement('span');
  spanElement.classList.add("token", token.type);
  spanElement.textContent = token.text;
  return spanElement;
}

function numberDelete(numberToken){
  if(numberToken.text.length <= 1){
    calculatorExpression.pop();
    return;
  }
  numberToken.text = numberToken.text.slice(0, -1);
}

function inputDel(){
  const expressionEnd = arrayBack(calculatorExpression);
  if(expressionEnd === undefined) return;
  if(expressionEnd.type === 'value' || expressionEnd.valueType === 'number'){
    numberDelete(expressionEnd);
  } else {
    calculatorExpression.pop();
  }
  updateCalculatorDisplay();
}

function clearDisplay(){
  calculatorExpression.length = 0;
  updateCalculatorDisplay();
}

function digitInputFn(input){
  return () => {
    pushDigitToExpression(input);
    updateCalculatorDisplay();
  }
}
function operationInputFn(operation){
  return () => {
    pushOperationToExpression(operation);
    updateCalculatorDisplay();
  }
}
function ansInputFn(){
  return () => {
    pushAnsToExpression();
    updateCalculatorDisplay();
  }
}

function keyToButton(buttonParent){
  return (key) => {
    //auto-fill missing data
    if(key.callBackFn === undefined){
      key.callBackFn = digitInputFn(key.text);
    }
    if(key.keydownChecks === undefined){
      key.keydownChecks = new Set([key.text]);
    }
    if(key.idText === undefined){
      key.idText = key.text.toLowerCase();
    }

    //create button
    const btn = document.createElement('button');
    btn.id = 'key-'+key.idText;
    btn.textContent = key.text;
    buttonParent.appendChild(btn);
    if(key.additionalClasses) btn.classList.add(...key.additionalClasses);
  
    //Add event listeners
    btn.addEventListener('click', key.callBackFn);
    window.addEventListener('keydown', (event) => {
      if(key.keydownChecks.has(event.key.toLowerCase())){
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
  callBackFn: operationInputFn('+'),
},{
  text: '−',
  idText: 'sub',
  callBackFn: operationInputFn('-'),
  keydownChecks: new Set('-')
},{
  text: '÷',
  idText: 'div',
  callBackFn: operationInputFn('/'),
  keydownChecks: new Set('/')
},{
  text: '×',
  idText: 'mult',
  callBackFn: operationInputFn('*'),
  keydownChecks: new Set('*')
},{
  text: '=',
  idText: 'eq',
  callBackFn: displayExpressionEvaluation,
  keydownChecks: new Set(['enter', '=']),
  additionalClasses: ['bottom-right']
}]
const operationPadButtons = operationPadKeys.map(keyToButton(operationPad));

/**
 * @param {"Math Error" | "Syntax Error"} type 
 * @param {string} message 
 * @returns returns an error object 
 */
function makeError(type, message){
  return{
    type: type,
    message: message,
    toString: function(){
      return `${this.type}: ${this.message}`;
    }
  }
}

/**
 * @param {undefined | Array} tokenizedExpression 
 * @returns operation to be executed last
 */
function getLastOperationIndex(tokenizedExpression){
  let i, lastOperationIndex;
  for(i = tokenizedExpression.length - 1; i >= 0; i--){
    const currentToken = tokenizedExpression[i];
    // console.log('i: '+i);
    if(currentToken.type !== 'operation'){
      continue;
    }
    if(lastOperationIndex === undefined){
      lastOperationIndex = i;
    } else if(currentToken.priority === 0) {
      return i;
    } else {
      const lastOperation = tokenizedExpression[lastOperationIndex];
      if(currentToken.priority < lastOperation.priority){
        lastOperationIndex = i;
      }
    }
  }

  return lastOperationIndex;
}


/**
 * @param {undefined | Array} tokenizedExpression 
 * @returns number (evaluaiton of expression) or CustomError
 */
function getExpressionEvaluation(tokenizedExpression){
  // If no argument is passed
  if(!tokenizedExpression){
    tokenizedExpression = calculatorExpression;
    for(token of tokenizedExpression){
      if(token.syntaxError){
        return makeError('Syntax Error', token.syntaxError);
      }
    }
  }

  if(tokenizedExpression.length === 1){
    return arrayFront(tokenizedExpression).getValue();
  }

  const lastOperationIndex = getLastOperationIndex(tokenizedExpression);
  if(lastOperationIndex !== undefined){
    const lastOperation = tokenizedExpression[lastOperationIndex];
    return operate(
      lastOperation, 
      //tokens to the opeartion's left
      tokenizedExpression.slice(0, lastOperationIndex), 
      //tokens to the operation's right
      tokenizedExpression.slice(lastOperationIndex + 1, tokenizedExpression.length)
    )
  }
}

function displayExpressionEvaluation(){
  console.log(getExpressionEvaluation());
  calculatorDisplayDiv.textContent = getExpressionEvaluation();
}

function operate(operation, a, b){
  const evaluationA = getExpressionEvaluation(a);
  const evaluationB = getExpressionEvaluation(b);

  if(evaluationA.message !== undefined){
    return evaluationA;
  }
  if(evaluationB.message !== undefined){
    return evaluationB;
  }

  return operation.basicFunction(
    evaluationA,
    evaluationB
  )
}