// ---- DOM constants ----
const calculatorDisplayDiv = document.querySelector(".calculator-display");
const calculatorOutputDiv = document.querySelector(".calculator-output");
const calculatorInputDiv = document.querySelector(".calculator-input");
const numPad = document.querySelector(".num-pad");
const operationPad = document.querySelector(".operation-pad");

// ---- Global Variables ----
const calculatorExpression = [];
/**
 * @type {'writing' | 'evaluated' | 'error'}
 */
var calculatorState;
const calculatorHistory = {
  previousResult: 0,
}

// ---- Dictionaries ----
const operationInfo = function(operation){
  switch(operation){
    case '-': return{
      text: '−',
      basicFunction: (a,b) => a - b,
      priority: 0,
    }
    case '/': return {
      text: '÷',
      basicFunction: (a,b) => {
        if(b === 0) return makeError('Math Error', 'Division by zero');
        return a / b;
      },
      priority: 1,
    }
    case '*': return {
      text: '×',
      basicFunction: (a,b) => a * b,
      priority: 1,
    }
    case '+': return {
      text: '+',
      basicFunction: (a,b) => a + b,
      priority: 0,
    }
    default: 
      throw new Error(operation + " is not an operation");
  }
}

const calculatorStates = function(state){
  switch(state){
    case 'writing': return{
      autoStartExpression: buildInputFn('digit','0'),
      setter: () => {
        calculatorState = "writing";
        showInputDiv();
        clearOutput();
        calculatorInputDiv.classList.add('active');
      }
    }
    case 'evaluated': return{
      autoStartExpression: buildInputFn('ans'),
      setter: () => {
        calculatorState = "evaluated";
        calculatorInputDiv.classList.remove('active');
      }
    }
    case 'error': return{
      autoStartExpression: buildInputFn('ans'),
      setter: () => {
        calculatorState = "error";
        calculatorInputDiv.classList.remove('active');
        hideInputDiv();
      }
    }
    default:
      throw new Error(state + " is not a state");
  }
}

/**
 * @param {'digit' | 'operation' | 'backspace' | 'ans'} updateType 
 * @param {any} payload 
 * @returns data about the update that occured
 */
const updateExpression = function(updateType, payload){
  switch(updateType){
    case'digit': 
      return pushDigitToExpression(payload);
    case'operation': 
      return pushOperationToExpression(payload);
    case'backspace': 
      return deleteFromExpression();
    case'ans':
      return pushAnsToExpression();
    default:
      throw new Error(updateType + " is not an update type");
  }
}

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
 * @param {any} memberToCount 
 */
function count(memberToCount, arr){
  if(typeof arr === 'string'){
    arr = arr.split('');
  }
  var currentCount = 0;
  for(let x of arr){
    if(x === memberToCount)
      currentCount++;
  }
  return currentCount;
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

function round(value, decimalPlaces = 4){
  if(typeof value === 'string'){
    value = Number.parseFloat(value);
  }
  return Math.round(value * (10 ** decimalPlaces)) / (10 ** decimalPlaces);
}

// ---- Manipulate Display ----
function pushTokenToInputDiv(){
  calculatorInputDiv.appendChild(
    tokenToHTMLSpan(arrayBack(calculatorExpression))
  );
}

function updateLastTokenInInputDiv(){
  calculatorInputDiv.replaceChild(
    tokenToHTMLSpan(arrayBack(calculatorExpression)),
    calculatorInputDiv.lastElementChild
  );
}

function popTokenFromInputDiv(){
  calculatorInputDiv.removeChild(calculatorInputDiv.lastChild);
}

function updateInputDiv({updateType}){
  switch(updateType){
    case 'update':
      updateLastTokenInInputDiv();
      break;
    case 'push':
      pushTokenToInputDiv();
      break;
    case 'pop':
      popTokenFromInputDiv();
      break;
    case 'none':
      break;
    default:
      throw new Error("update type for updateInputDiv(updateType) can only be "
      + "'update', 'push', 'pop', or 'none'\n"
      + updateType + " was entered");
  }
}

function clearInputDiv(){
  while(calculatorInputDiv.firstChild !== null){
    calculatorInputDiv.removeChild(calculatorInputDiv.lastChild);
  }
}

function hideInputDiv(){
  calculatorInputDiv.style.display = 'none';
}

function showInputDiv(){
  calculatorInputDiv.style.display = 'block';
}

function clearInput(){
  calculatorExpression.length = 0;
  clearInputDiv();
}

function clearOutput(){
  calculatorOutputDiv.textContent = '';
}

function clearDisplay(){
  clearInput();
  clearOutput();
}

// ---- Set Calculator State ----
function setCalculatorState(state, payload){
  calculatorStates(state).setter(payload);
}
setCalculatorState('writing');

// ---- Object "Constructors" ----
/**
 * @param {'push' | 'update' | 'pop' | 'none'} updateType 
 * @returns 
 */
function makeUpdateData(updateType){
  return{
    updateType: updateType
  }
}

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
    ... operationInfo(operation)
  }
}

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

// ---- Mapping Functions ----
function tokenToHTMLSpan(token){
  const spanElement = document.createElement('span');
  spanElement.classList.add("token", token.type);
  if(token.type === 'value'){
    spanElement.classList.add(token.valueType);
  }
  spanElement.textContent = token.text;
  if(token.syntaxError){
    spanElement.classList.add("error");
    spanElement.dataset.errorMessage = token.syntaxError;
  }
  return spanElement;
}

function keyToButton(buttonParent){
  return (key) => {
    //auto-fill missing data
    if(key.callBackFn === undefined){
      key.callBackFn = buildInputFn('digit',key.text);
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

// ---- Manipulate Expression ----
function pushNumberToExpression(n){
  calculatorExpression.push(makeNumberToken(n));
  return makeUpdateData('push');
}

function pushAnsToExpression(){
  calculatorExpression.push({
    type: 'value',
    valueType: 'variable',
    text: 'Ans',
    getValue: function () {
      return calculatorHistory.previousResult;
    }
  });
  return makeUpdateData('push');
}

function autoStartExpression(){
  calculatorStates(calculatorState).autoStartExpression();
}

function pushOperationToExpression(operation){
  if(calculatorExpression.length === 0){
    autoStartExpression();
  }
  const lastToken = arrayBack(calculatorExpression);
  if(lastToken.type === "operation"){
    updateInputDiv(updateExpression('backspace'))
  }
  calculatorExpression.push(makeOperationToken(operation));
  return makeUpdateData('push');
}

function pushDigitToExpression(digit){
  const expressionEnd = arrayBack(calculatorExpression);

  if(expressionEnd === undefined || expressionEnd.type !== "value"){
    return pushNumberToExpression(digit);
  }
  expressionEnd.text += digit;
  return makeUpdateData('update');
}

const numberTokenIsValid = (numToken) => {
  return count('.', numToken.text) <= 1;
}

function numberDelete(numberToken){
  if(numberToken.text.length <= 1){
    calculatorExpression.pop();
    return makeUpdateData('pop');
  }
  numberToken.text = numberToken.text.slice(0, -1);
  return makeUpdateData('update');
}

function deleteFromExpression(){
  if(calculatorExpression.length === 0) 
    return makeUpdateData('none');
  
  const expressionEnd = arrayBack(calculatorExpression);
  if(expressionEnd.type === 'value' && expressionEnd.valueType === 'number'){
    return numberDelete(expressionEnd);
  }

  calculatorExpression.pop();
  return makeUpdateData('pop');
}

function validateExpression(){
  for(const currentToken of calculatorExpression){
    if(currentToken.valueType === "number"){
      if(numberTokenIsValid(currentToken)){
        currentToken.syntaxError = undefined;
      } else {
        currentToken.syntaxError = "Too many decimal points";
      }
    }
  }
}

function pauseCusorAnimation(){
  calculatorInputDiv.classList.add("pause-animation");
  setInterval(() => {calculatorInputDiv.classList.remove("pause-animation");}, 800);
}

function buildInputFn(inputType, value){
  return () => {
    if((calculatorState !== "writing")
     && inputType !== 'backspace')
        clearInput();
    const updateData = updateExpression(inputType, value);
    if(calculatorState !== "writing")
      setCalculatorState('writing', inputType);
    validateExpression();
    updateInputDiv(updateData);
    pauseCusorAnimation();
  }
}

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
  keydownChecks: new Set(['a']),
  callBackFn: buildInputFn('ans')
}];
const numberPadButtons = numberPadKeys.map(keyToButton(numPad));

const operationPadKeys = [{
  text: 'DEL',
  callBackFn: buildInputFn('backspace'),
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
  callBackFn: buildInputFn('operation','+'),
},{
  text: '−',
  idText: 'sub',
  callBackFn: buildInputFn('operation','-'),
  keydownChecks: new Set('-')
},{
  text: '÷',
  idText: 'div',
  callBackFn: buildInputFn('operation','/'),
  keydownChecks: new Set('/')
},{
  text: '×',
  idText: 'mult',
  callBackFn: buildInputFn('operation','*'),
  keydownChecks: new Set('*')
},{
  text: '=',
  idText: 'eq',
  callBackFn: displayExpressionEvaluation,
  keydownChecks: new Set(['enter', '=']),
  additionalClasses: ['bottom-right']
}]
const operationPadButtons = operationPadKeys.map(keyToButton(operationPad));


// ---- Evaluation ----
/**
 * @param {undefined | Array} tokenizedExpression 
 * @returns operation to be executed last
 */
function getLastOperationIndex(tokenizedExpression){
  let i, lastOperationIndex;
  for(i = tokenizedExpression.length - 1; i >= 0; i--){
    const currentToken = tokenizedExpression[i];
    if(currentToken.type !== 'operation'){
      continue;
    }
    if(lastOperationIndex === undefined){
      lastOperationIndex = i;
    } else {
      const lastOperation = tokenizedExpression[lastOperationIndex];
      if(currentToken.priority < lastOperation.priority){
        lastOperationIndex = i;
      }
    }
    if(currentToken.priority === 0) {
      return i;
    } 
  }
  return lastOperationIndex;
}

/**
 * @param {undefined | Array} tokenizedExpression 
 * @returns number (evaluaiton of expression) or CustomError
 */
function getExpressionEvaluation(tokenizedExpression){
  var evaluation;
  // If no argument is passed
  if(!tokenizedExpression){
    tokenizedExpression = calculatorExpression;
    for(let token of tokenizedExpression){
      if(token.syntaxError){
        evaluation = makeError('Syntax Error', token.syntaxError);
      }
    }
  }
  
  if(evaluation === undefined){
    if(tokenizedExpression.length === 1){
      evaluation = arrayFront(tokenizedExpression).getValue();
    }else{
      const lastOperationIndex = getLastOperationIndex(tokenizedExpression);
      if(lastOperationIndex !== undefined){
        const lastOperation = tokenizedExpression[lastOperationIndex];
        evaluation = operate(
          lastOperation, 
          //tokens to the opeartion's left
          tokenizedExpression.slice(0, lastOperationIndex), 
          //tokens to the operation's right
          tokenizedExpression.slice(lastOperationIndex + 1, tokenizedExpression.length)
        );
      }
    }
  }
  if(typeof evaluation === "number"){
    calculatorHistory.previousResult = evaluation;
    setCalculatorState('evaluated');
  } else {
    if(evaluation === undefined){
      evaluation = makeError('Syntax Error', 'trailing operation');
    }
    setCalculatorState('error');
  }
  
  return evaluation;
}

function displayExpressionEvaluation(){
  calculatorOutputDiv.textContent = getExpressionEvaluation();
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

window.addEventListener('keydown', (event) => {
  if(event.key.toLowerCase() === 'arrowleft'){
    setCalculatorState('writing');
  }
})