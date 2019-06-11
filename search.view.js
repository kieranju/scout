// search props
let searchNode = document.getElementsByClassName('search-input')[0],
    searchHist = '';

// handle search input
var typeTimer = null,
    typeWait = 225,
    typeBypass = [
        9,  // tab
        16, // shift
        17, // ctrl
        27, // escape
        38, // up arrow
        40, // down arrow
    ];

// init search
searchNode.addEventListener('keyup', (e) => {
    clearTimeout(typeTimer);

    // [ESC] is pressed, clear search
    if (e.keyCode === 27) searchNode.value = '';

    // santize new search query
    var searchNew = searchNode.value.trim();

    // do not repeat same search
    if (searchNew === searchHist) return;

    // restricted keys
    if (typeBypass.indexOf(e.keyCode) > -1) return;

    // [ENTER] is pressed, skip timeout delay
    if (e.keyCode === 13) {
        searchHist = sendSearch(searchNew);
    } else {
        typeTimer = setTimeout(function () {
            searchHist = sendSearch(searchNew);
        }.bind(this), typeWait);
    }
});

// keep search in focus
searchNode.focus();
searchNode.addEventListener('blur', (e) => {
    searchNode.focus();
});

// init results view
let results = new ResultView(
    document.getElementsByClassName('results-list')[0],
    document.getElementsByClassName('result')
);
results.focus();

// TODO: handle ResultView refresh when results are added/removed
