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


function fuzzySearch(needle, haystack) {
    needle = needle.toLowerCase();
    haystack = haystack.toLowerCase();
    const haystackLength = haystack.length;
    const needleLength = needle.length;

    if (needleLength == 0 || needleLength > haystackLength) {
        return false;
    }

    if (needleLength === haystackLength) {
        return needle === haystack;
    }

    let indexHaystack = 0;
    for (let indexNeedle = 0; indexNeedle < needleLength; indexNeedle++) {
        const needleChar = needle.charCodeAt(indexNeedle);
        let foundChar = false;

        while (indexHaystack < haystackLength) {
            if (haystack.charCodeAt(indexHaystack++) === needleChar) {
                foundChar = true;
                break;
            }
        }

        if(!foundChar){
            return false;
        }
    }
    return true;
}

function autocomplete(val) {

    addExerciseBtn.style.visibility = "visible";
    renameExerciseBtn.style.visibility = currentExercise !== undefined ? "visible" : "hidden";

    // Search for the exercise if more than 1 chars are in the val
    let exerciseReturn = exercises.filter(e => fuzzySearch(val, e.name));

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

    let oldDate;
    let rotatingClasses = ["light-background", "grey-background"];
    let rotatingIndex = 0;

    const sortedSets = ex.sets
        .toSorted((a, b) => b.timestamp - a.timestamp)
        .map(e => {
            let date = (new Date(e.timestamp)).toLocaleDateString();
            if(oldDate != date) {
                rotatingIndex++;
                oldDate = date;
            }
            let cls = ["history-record", rotatingClasses[rotatingIndex%rotatingClasses.length]];
            let data = [
                e.weight,
                e.reps,
                Display.formatDateTime(e.timestamp),
                Display.confirmActionLink("Del", "Are you sure you want to delete this set ?", () => delRep(e.id))
            ]
            return Display.createRow(data, cls);
        });
    historyTable.append(...sortedSets);
    window.scroll({top: 0, left: 0, behavior: 'smooth'});
    currentExercise = ex;
}

function clearHistory(){
    Display.removeElementsByClassname("history-record");
}

function getExerciseByID(id) {
    return exercises.find((element) => element.id == id)
}

function clearRepsAndWeightsInputs() {
    weightInput.value = "";
}

function reloadExercisesList(){
    const exRecords = document.getElementsByClassName("exercise-record");
    while(exRecords.length > 0){
        exRecords[0].remove();
    }
    const sortedE = exercises.toSorted((a,b) => Math.max(...b.sets.map(s => s.timestamp))-Math.max(...a.sets.map(s=> s.timestamp)))
    .map(e => {
        const sortedSets = e.sets.toSorted((a,b) => b.timestamp - a.timestamp);
        return [
            Display.createLink(e.name, () => loadExercise(e.id)),
            sortedSets.length > 0 ? Display.formatDateTime(sortedSets[0].timestamp) : "Nothing Recorded Yet",
            Display.confirmActionLink("Del", "Are you sure you want to delete this exercise ?", () => delExercise(e.id))
    ]});

    exerciseListTable.append(...Display.createRows(sortedE, "exercise-record"));
}

function saveSets() {
    const timestamp = Date.now();
    currentExercise.sets.push({
        id: Date.now(),
        reps: repsInput.value,
        weight: weightInput.value,
        timestamp: timestamp
    });
    persistToLocalStorage();
    loadExercise(currentExercise.id);
    reloadExercisesList();
}

function renameExercise() {
    currentExercise.name = searchBox.value;
    renameExerciseBtn.style.visibility = "hidden";
    persistToLocalStorage();
    loadExercise(currentExercise.id);
    reloadExercisesList();
}

function delExercise(eID) {
    const index = exercises.findIndex(ex=> ex.id == eID);
    if (index !== -1) {
        exercises.splice(index, 1);
    }
    persistToLocalStorage();
    clearHistory();
    reloadExercisesList();
    history.style.visibility = "hidden";
    inputContainer.style.visibility = "hidden";
    searchBox.value = "";
}

function addExercise() {
    renameExerciseBtn.style.visibility = "hidden";
    const exerciseId = Date.now();
    exercises.push({
        id: exerciseId,
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