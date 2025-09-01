'use strict';

const atomBankData = [
    { id: 1, element: 'H' },
    { id: 2, element: 'H' },
    { id: 3, element: 'H' },
    { id: 4, element: 'O' },
    { id: 5, element: 'O' },
    { id: 6, element: 'C' }
];

const bankWidth = 200;
const molecules = [
    {
        name: 'Water',
        formula: 'H₂O',
        points: 2,
        atoms: [ { id: 'o1', type: 'O' }, { id: 'h1', type: 'H' }, { id: 'h2', type: 'H' }, ],
        bonds: [ ['o1', 'h1'], ['o1', 'h2'], ],
    },
    {
        name: 'Hydrogen Peroxide',
        formula: 'H₂O₂',
        points: 4,
        atoms: [ { id: 'h1', type: 'H' }, { id: 'o1', type: 'O' }, { id: 'o2', type: 'O' }, { id: 'h2', type: 'H' }, ],
        bonds: [ ['h1', 'o1'], ['o1', 'o2'], ['o2', 'h2'], ],
    },
    {
        name: 'Carbon Dioxide',
        formula: 'CO₂',
        points: 3,
        atoms: [ { id: 'c1', type: 'C' }, { id: 'o1', type: 'O' }, { id: 'o2', type: 'O' }, ],
        bonds: [ ['c1', 'o1'], ['c1', 'o2'], ],
    },
    // Will add more complex molecules here later
];

const currentMolecule = molecules[Math.max(0,Math.floor(Math.random() * 3 - 0.01))];
document.getElementById('molecule-name').textContent = currentMolecule.name;
document.getElementById('molecule-formula').innerHTML = currentMolecule.formula;

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
    console.log(`checking for ${currentMolecule.name}`);
    const boardWidth = gameBoard.offsetWidth;
    const bankBoundary = boardWidth - bankWidth;

    const atomsInPlay = Array.from(document.querySelectorAll('.atom')).filter(
        atom => atom.offsetLeft < bankBoundary
    );
    const requiredCounts = {};
    currentMolecule.atoms.forEach(atom =>
        requiredCounts[atom.type] = (requiredCounts[atom.type] || 0) + 1
    );

   

    const requiredBondCounts = {};
    currentMolecule.atoms.forEach(atom => requiredBondCounts[atom.id] = 0);
    currentMolecule.bonds.forEach(bond => {
        requiredBondCounts[bond[0]]++;
        requiredBondCounts[bond[1]]++;
    });

    const isCorrect = findValidArrangement(atomsInPlay, currentMolecule.atoms, currentMolecule.bonds, requiredBondCounts);

    if (isCorrect) {
        alert(`success, you built ${currentMolecule.name} and scored ${currentMolecule.points}`)
    } else {
        alert('atoms are not connected correctly, check your bonds')
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