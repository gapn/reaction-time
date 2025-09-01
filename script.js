'use strict';

const atomBankData = [
    { id: 1, element: 'H' },
    { id: 2, element: 'H' },
    { id: 3, element: 'H' },
    { id: 4, element: 'O' },
    { id: 5, element: 'O' },
    { id: 6, element: 'C' }
];

const gameBoard = document.getElementById('game-board');

populateAtomBank();

function populateAtomBank() {
    gameBoard.innerHTML = '';
    const boardWidth = gameBoard.offsetWidth;
    const bankAreaStart = boardWidth - 150;

    atomBankData.forEach((atomData, index) => {
        const atomElement = document.createElement('div');
        atomElement.className = `atom atom-${atomData.element.toLowerCase()}`;
        atomElement.textContent = atomData.element;
        atomElement.dataset.id = atomData.id;
        atomElement.style.position = 'absolute';
        atomElement.style.left = `${bankAreaStart}px`;
        atomElement.style.top = `${20 + index * 65}px`;
        gameBoard.appendChild(atomElement);
    });
}

let selectedAtom = null;
let offsetX = 0;
let offsetY = 0;
let highestZIndex = 1;

document.addEventListener('mousedown', (event) => {
    const atom = event.target.closest('.atom');
    if (!atom) return;

    atom.classList.add('selected-atom');
    selectedAtom = atom;

    selectedAtom.style.zIndex = ++highestZIndex;

    const boardRect = gameBoard.getBoundingClientRect();
    const mouseXInBoard = event.clientX - boardRect.left;
    const mouseYInBoard = event.clientY - boardRect.top;
    offsetX = mouseXInBoard - selectedAtom.offsetLeft;
    offsetY = mouseYInBoard - selectedAtom.offsetTop;

    document.addEventListener('mousemove', mouseMove);
    document.addEventListener('mouseup', mouseUp);
});

function mouseMove(event) {
    if (!selectedAtom) return;

    const boardRect = gameBoard.getBoundingClientRect();
    let newX = event.clientX - boardRect.left - offsetX;
    let newY = event.clientY - boardRect.top - offsetY;

    const boardWidth = gameBoard.offsetWidth;
    const boardHeight = gameBoard.offsetHeight;
    const atomWidth = selectedAtom.offsetWidth;
    const atomHeight = selectedAtom.offsetHeight;

    newX = Math.max(0, Math.min(newX, boardWidth - atomWidth));
    newY = Math.max(0, Math.min(newY, boardHeight - atomHeight));

    selectedAtom.style.left = `${newX}px`;
    selectedAtom.style.top = `${newY}px`;
}

function mouseUp() {
    if (!selectedAtom) return;
    
    selectedAtom.classList.remove('selected-atom');

    selectedAtom = null;
    document.removeEventListener('mousemove', mouseMove);
    document.removeEventListener('mouseup', mouseUp);

    checkForCompletion();
}

function checkForCompletion() {
    console.log('Checking for a complete molecule...')
    //code coming in next steps
}