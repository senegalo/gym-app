const EXERCISES_VERSION = "EXERCISES_v0.0.1";
const DEFAULT_REPS = 10;
let exercises = []

const searchBox = document.getElementById("search");
const history = document.getElementById("history");
const historyTable = document.getElementById("history-table");
const exerciseListTable= document.getElementById("exercise-list-table");
const inputContainer = document.getElementById("input-container");
const weightInput = document.getElementById("weight");
const repsInput = document.getElementById("reps");
const saveBtn = document.getElementById("save-button");
const addExerciseBtn = document.getElementById("add-exercise");
const renameExerciseBtn = document.getElementById("rename-exercise");
const exportBtn = document.getElementById("export-data");
let currentExercise;

function autocomplete(val) {

    addExerciseBtn.style.visibility = "visible";
    renameExerciseBtn.style.visibility = currentExercise !== undefined ? "visible" : "hidden";

    // Search for the exercise if more than 1 chars are in the val
    let exerciseReturn = getExercisesByName(val);

    // Display / cleanup results
    if (exerciseReturn.length == 0 && document.getElementById('autocomplete')) {
        removeAutocompleteBox();
    } else {
        if (!document.getElementById('autocomplete')) {
            let autocompleteDiv = document.createElement('div');
            autocompleteDiv.setAttribute('id', 'autocomplete');
            autocompleteDiv.setAttribute('class', 'search-container');
            document.getElementById('search').parentNode.insertBefore(autocompleteDiv, document.getElementById('search').nextSibling);
        }
        document.getElementById('autocomplete').innerHTML = '';
        for (let i = 0; i < exerciseReturn.length; i++) {
            document.getElementById('autocomplete').innerHTML += '<div class="exercise-selector" onclick="loadExercise(' + exerciseReturn[i].id + ')">' + exerciseReturn[i].name + '</div>';
        }
    }
};

function removeAutocompleteBox() {
    const autocompleteBox = document.getElementById('autocomplete');
    if (autocompleteBox) autocompleteBox.remove();
}

function loadExercise(exerciseID) {
    removeAutocompleteBox();
    history.style.visibility = "visible";
    inputContainer.style.visibility = "visible";
    addExerciseBtn.style.visibility = "hidden";
    clearRepsAndWeightsInputs();

    const ex = getExerciseByID(exerciseID);

    searchBox.value = ex.name;

    clearHistory();
    const sortedSets = ex.sets.toSorted((a, b) => b.timestamp - a.timestamp);
    for (let i = 0; i < sortedSets.length; i++) {
        insertHistory(sortedSets[i].weight, sortedSets[i].reps, sortedSets[i].timestamp, sortedSets[i].id);
    }
    currentExercise = ex;
}

function getExerciseByID(id) {
    return exercises.find((element) => element.id == id)
}

function getExercisesByName(name) {
    let exerciseReturn = [];
    for (let i = 0; i < exercises.length && name.length > 0; i++) {
        if (name.toLowerCase() === exercises[i].name.toLowerCase().slice(0, name.length)) {
            exerciseReturn.push(exercises[i]);
        }
    }
    return exerciseReturn;
}

function clearRepsAndWeightsInputs() {
    weightInput.value = "";
    repsInput.value = DEFAULT_REPS;
}

function clearHistory() {
    const elements = document.getElementsByClassName("history-record");
    while (elements.length > 0) {
        elements[0].remove();
    }
}

function insertHistory(weight, reps, timestamp, repId) {
    const tr = document.createElement("tr");
    tr.classList.add("history-record");
    historyTable.appendChild(tr);

    const weightCell = document.createElement("td");
    weightCell.appendChild(document.createTextNode(weight));

    const repsCell = document.createElement("td");
    repsCell.appendChild(document.createTextNode(reps));

    const timestampCell = document.createElement("td");
    timestampCell.appendChild(document.createTextNode(new Date(timestamp)));

    const delRepCell = document.createElement("td");
    const delLink = document.createElement("a");
    delLink.appendChild(document.createTextNode("Del"));
    delLink.href = "javascript:delRep(" + repId + ")";
    delRepCell.appendChild(delLink)

    tr.appendChild(weightCell);
    tr.appendChild(repsCell);
    tr.appendChild(timestampCell);
    tr.appendChild(delRepCell);
}

function reloadExercisesList(){
    const exRecords = document.getElementsByClassName("exercise-record");
    while(exRecords.length > 0){
        exRecords[0].remove();
    }
    exercises.forEach(e => {
        const tr = document.createElement("tr");
        tr.classList.add("exercise-record");
        exerciseListTable.appendChild(tr);

        const exNameCell = document.createElement("td");
        const exNameLink = document.createElement("a");
        exNameLink.onclick = () => loadExercise(e.id);
        exNameLink.href = "javascript:void(0)";
        exNameLink.appendChild(document.createTextNode(e.name));
        exNameCell.appendChild(exNameLink);

        const sortedSets = e.sets.toSorted((a,b) => b.timestamp - a.timestamp);

        const lastSetCell = document.createElement("td");
        lastSetCell.appendChild(document.createTextNode(sortedSets.length > 0 ? new Date(sortedSets[0].timestamp) : "Nothing Recorded Yet"))

        tr.appendChild(exNameCell);
        tr.appendChild(lastSetCell);
    })
}

function saveSets() {
    const timestamp = Date.now();
    currentExercise.sets.push({
        id: currentExercise.sets.length,
        reps: repsInput.value,
        weight: weightInput.value,
        timestamp: timestamp
    });
    persistToLocalStorage();
    loadExercise(currentExercise.id);
}

function renameExercise() {
    currentExercise.name = searchBox.value;
    renameExerciseBtn.style.visibility = "hidden";
    persistToLocalStorage();
    loadExercise(currentExercise.id);
}

function addExercise() {
    const exerciseId = exercises.length;
    exercises.push({
        id: exercises.length,
        name: searchBox.value,
        sets: []
    });
    persistToLocalStorage();
    reloadExercisesList();
    loadExercise(exerciseId);
}

function delRep(setId) {
    const index = currentExercise.sets.findIndex(set => set.id == setId);
    if (index !== -1) {
        currentExercise.sets.splice(index, 1);
    }
    persistToLocalStorage();
    loadExercise(currentExercise.id);
}

function persistToLocalStorage() {
    localStorage.setItem(EXERCISES_VERSION, JSON.stringify(exercises));
}

function loadFromLocalStorage() {
    var localExercises = localStorage.getItem(EXERCISES_VERSION);
    if(localExercises){
        exercises = JSON.parse(localExercises);
    } else {
        exercises = [];
    }
}

function exportData() {
    var csv = 'exerciseID,exerciseName,setID,weight,reps,timestamp\n';
    exercises.forEach(function(ex) {
        ex.sets.forEach(function(set){
            csv += ex.id + ',"' + ex.name + '",' + set.id + ',' + set.weight + ',' + set.reps + ',' + set.timestamp + '\n';
        })
    });
    
    // Create Blob from CSV string
    var csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    
    // Using URL and a link, you can make browser download it
    var csvUrl = URL.createObjectURL(csvBlob);
    var link = document.createElement('a');
    link.href = csvUrl;
    link.setAttribute('download', 'export.csv');
    link.click();
}

// Bind events
searchBox.oninput = function (ev) {
    autocomplete(searchBox.value);
};

saveBtn.onclick = function (ev) {
    saveSets();
}

addExerciseBtn.onclick = function () {
    addExercise();
}

exportBtn.onclick = function(){
    exportData();
}

renameExerciseBtn.onclick = function(){
    renameExercise();
}

// Load data from local storage
loadFromLocalStorage();
reloadExercisesList();