'use strict';

const atomBankData = [
    { id: 1, element: 'H' },
    { id: 2, element: 'H' },
    { id: 3, element: 'H' },
    { id: 4, element: 'O' },
];

let nextAtomId = 5;

let molecules = [];

const bankWidth = 200;
let score = 0;
let timeLeft = 30;
let timerInterval = null;
let currentMoleculeIndex = 0;

const gameBoard = document.getElementById('game-board');

populateAtomBank();

function populateAtomBank() {
    gameBoard.innerHTML = '';
    const boardWidth = gameBoard.offsetWidth;
    const bankAreaStart = boardWidth - (bankWidth / 1.5);

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

function replenishAtomBank(atomsToAdd) {
    const boardWidth = gameBoard.offsetWidth;
    const bankAreaX = boardWidth - (bankWidth / 1.5);
    const startY = 20;
    const gap = 65;

    const bankAtoms = Array.from(document.querySelectorAll('.atom'))
        .filter(atom => atom.offsetLeft >= (boardWidth - bankWidth));

    atomsToAdd.forEach(atomData => {
        let placed = false;
        let potentialY = startY;

        while (!placed) {
            let spotOccupied = false;
            for (const existingAtom of bankAtoms) {
                if (Math.abs(existingAtom.offsetTop - potentialY) < gap / 2) {
                    spotOccupied = true;
                    break;
                }
            }

            if (!spotOccupied) {
                const atomElement = document.createElement('div');
                atomElement.className = `atom atom-${atomData.element.toLowerCase()}`;
                atomElement.textContent = atomData.element;
                atomElement.dataset.id = nextAtomId++;
                atomElement.style.position = 'absolute';
                atomElement.style.left = `${bankAreaX}px`;
                atomElement.style.top = `${potentialY}px`;
                gameBoard.appendChild(atomElement);
                
                bankAtoms.push(atomElement);
                placed = true;
            } else {
                potentialY += gap;
            }
        }
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
}

document.getElementById('check-button').addEventListener('click', checkMolecule);

function doAtomsOverlap(atom1, atom2) {
    const rect1 = atom1.getBoundingClientRect();
    const rect2 = atom2.getBoundingClientRect();

    const radius1 = rect1.width / 2;
    const centerX1 = rect1.left + radius1;
    const centerY1 = rect1.top + radius1;

    const radius2 = rect2.width / 2;
    const centerX2 = rect2.left + radius2;
    const centerY2 = rect2.top + radius2;

    const deltaX = centerX1 - centerX2;
    const deltaY = centerY1 - centerY2;
    const distanceSquared = (deltaX * deltaX) + (deltaY * deltaY);

    const sumOfRadii = radius1 + radius2;
    const sumOfRadiiSquared = sumOfRadii * sumOfRadii;

    return distanceSquared < sumOfRadiiSquared;
}

function checkMolecule() {
    const currentMolecule = molecules[currentMoleculeIndex];
    console.log(`checking for ${currentMolecule.name}`);
    const boardWidth = gameBoard.offsetWidth;
    const bankBoundary = boardWidth - bankWidth;

    const atomsInPlay = Array.from(document.querySelectorAll('.atom')).filter(
        atom => atom.offsetLeft < bankBoundary
    );

    const requiredBondCounts = {};
    currentMolecule.atoms.forEach(atom => requiredBondCounts[atom.id] = 0);
    currentMolecule.bonds.forEach(bond => {
        requiredBondCounts[bond[0]]++;
        requiredBondCounts[bond[1]]++;
    });

    const isCorrect = findValidArrangement(atomsInPlay, currentMolecule.atoms, currentMolecule.bonds, requiredBondCounts);

    if (isCorrect) {

        score += timeLeft;
        timeLeft += 5;

        if (currentMolecule.atomsToAdd && currentMolecule.atomsToAdd.length > 0) {
            replenishAtomBank(currentMolecule.atomsToAdd);
        }

        currentMoleculeIndex++;

        if (currentMoleculeIndex >= molecules.length) {
            clearInterval(timerInterval);
            alert(`Congratulations! You've built all the molecules! Final Score: ${score}`);
            document.getElementById('check-button').disabled = true;
        } else {
            loadMolecule(currentMoleculeIndex);
        }

        updateDisplay();
    } else {
        alert('atoms are not connected correctly, check your bonds')
        timeLeft -= 5;
        updateDisplay();
    };
}

function findValidArrangement(availableBoardAtoms, atomsToAssign, requiredBonds, requiredBondCounts, assignments = {}) {
    if (atomsToAssign.length === 0) {
        for (const bond of requiredBonds) {
            const realAtom1 = assignments[bond[0]];
            const realAtom2 = assignments[bond[1]];
            if (!doAtomsOverlap(realAtom1, realAtom2)) {
                return false;
            }
        }

        for (const blueprintId in assignments) {
            const realAtom = assignments[blueprintId];
            let actualBonds = 0;

            for (const otherBlueprintId in assignments) {
                if (blueprintId === otherBlueprintId) continue;
                
                const otherRealAtom = assignments[otherBlueprintId];
                if (doAtomsOverlap(realAtom, otherRealAtom)) {
                    actualBonds++;
                }
            }

            if (actualBonds !== requiredBondCounts[blueprintId]) {
                return false;
            }
        }

        return true;
    }

    const currentRequiredAtom = atomsToAssign[0];
    const remainingAtomsToAssign = atomsToAssign.slice(1);
    const possibleMatches = availableBoardAtoms.filter(boardAtom => boardAtom.textContent === currentRequiredAtom.type);

    for (const match of possibleMatches) {
        assignments[currentRequiredAtom.id] = match;
        const remainingBoardAtoms = availableBoardAtoms.filter(atom => atom.dataset.id !== match.dataset.id);

        if (findValidArrangement(remainingBoardAtoms, remainingAtomsToAssign, requiredBonds, requiredBondCounts, assignments)) {
            return true;
        }
    }

    return false;
}

function updateDisplay() {
    document.getElementById('score-display').textContent = score;
    document.getElementById('time-display').textContent = timeLeft;
}

function startGame() {
    score = 0;
    timeLeft = 60;
    currentMoleculeIndex = 0;
    loadMolecule(currentMoleculeIndex);
    updateDisplay();

    // Start the countdown
    timerInterval = setInterval(() => {
        timeLeft--;
        updateDisplay();

        if (timeLeft <= 0) {
            clearInterval(timerInterval); // Stop the timer
            alert(`Game Over! Your final score is: ${score}`);
            document.getElementById('check-button').disabled = true; // Disable checking
        }
    }, 1000);
}

function loadMolecule(index) {
    const molecule = molecules[index];
    document.getElementById('molecule-name').textContent = molecule.name;
    document.getElementById('molecule-formula').innerHTML = molecule.formula;
}

function gameOver(message) {
    clearInterval(timerInterval); // Stop the timer
    alert(`Game Over! ${message}\nYour final score is: ${score}`);
    document.getElementById('check-button').disabled = true; // Disable checking
}

async function loadGameData() {
    const response = await fetch('molecules.json');
    molecules = await response.json();
    startGame();
}
loadGameData();