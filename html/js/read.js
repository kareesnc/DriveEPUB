// The main script handler for read.html

var book;       // the active book object
var bookData;   // the binary data from Drive, for re-rendering
var doc_id;     // the requested book's document ID
var loc_doc_id; // the doc ID containing loc data for faster access
var cur_cfi;    // the CFI as  of the last relocate call

// If signed in, check state and fetch book
function signedIn() {
    // Fetch the state, which will contain the document ID
    var params = URLSearchParams && new URLSearchParams(document.location.search.substring(1));
    var state = JSON.parse(params.get('state'));
    if (state) {
        doc_id  = state.ids[0];
        $("#bookLoading").css("display","block");
        fetchDriveFile();
    }
    else {
        showError("Could not get document ID");
    }
}

// If signed out, show authorize buttons
function signedOut() {
    $(".authorize").css("display", "block");
    $("#bookLoading").css("display", "none");
    $("#book").css("visibility", "hidden");
    if(book) {
        destroyBook(book);
    }
}

// This should be called only on fatal errors
function showError(message) {
    $("#bookLoading").css("display", "none");
    $("#book").css("visibility", "hidden");
    $("#error").css("display", "block");
    $("#error").append("<p><b>Error:</b> " + message + "</p>");
    console.error("Error: "+message);
}

function refreshBook() {
    destroyBook(book);
    book = openBook(bookData,cur_cfi);
}

function toggleToc() {
    if($("#toc").hasClass("expanded")) {
        $("#toc").removeClass("expanded");
        $("#bookContent").addClass("expanded");
    }
    else {
        $("#toc").addClass("expanded");
        $("#bookContent").removeClass("expanded");
    }
    refreshBook();
}

function createBookLocationRecord() {
    gapi.client.drive.files.create({
        name: doc_id+'.epubcfi',
        mimeType: 'text/plain',
        parents: ['appDataFolder']
    }).then(function (response) {
        if(response.result && response.result.id) {
            loc_doc_id = response.result.id;
        }
        else {
            console.error("Response not found or did not contain ID");
            console.error(response);
        }
    }, function (error) {
        console.error("Could not create book location record due to an error:");
        console.error(error);
    });
}

function updateBookLocation(epubcfiString) {
    cur_cfi = epubcfiString;
}

function updateBookLocationRecord() {
    var contentBlob = new Blob([cur_cfi], {type: 'text/plain'});
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'json';
    xhr.open('PATCH', 'https://www.googleapis.com/upload/drive/v3/files/' + loc_doc_id + '?uploadType=media');
    xhr.setRequestHeader('Authorization', 'Bearer ' + gapi.auth.getToken().access_token);
    xhr.send(contentBlob);
}

async function fetchBookLocationRecord() {
    await gapi.client.drive.files.list({
        q: "name: '"+doc_id+".epubcfi'",
        spaces: 'appDataFolder',
        fields: 'nextPageToken, files(id, name)',
        pageSize: 1
    }).then(function (response) {
        if(response.result && response.result.files.length>0) {
            loc_doc_id = response.result.files[0].id;
            if(response.result.nextPageToken) {
                console.warn("WARNING: There are multiple records for this book");
            }
        }
        else {
            console.log("No location record found, creating...");
            createBookLocationRecord();
        }
    }, function (error) {
        console.error("Failed to locate book location record");
        console.error(error);
    });
    await gapi.client.drive.files.get({
        fileId: loc_doc_id,
        alt: 'media'
    }).then(function (response) {
        if (response.body && response.headers['Content-Type'] == 'text/plain') {
            cur_cfi = response.body;
        }
        else {
            console.warn("Location record not found or was empty");
        }
    }, function (error) {
        console.error("Failed to fetch book location record");
        console.error(error);
    });
}

async function fetchDriveFile() {
    // Attempt to fetch location; will be null on failure
    await fetchBookLocationRecord();
    gapi.client.drive.files.get({
        fileId: doc_id,
        alt: 'media'
    }).then(function (response) {
        if (response.body && response.headers['Content-Type'] == 'application/epub+zip') {
            // if the book has rendered before, destroy it before re-rendering
            if(book && book.destroy){
                book.destroy();
            }
            bookData = response.body;
            book = openBook(bookData,cur_cfi);
            // re-render the book when the window changes size
            $(window).resize(refreshBook);
        }
        else {
            showError("Response body not found or not epub");
            console.error(response);
        }
    }, function (error) {
        showError("Failed to fetch book from Drive");
        console.error(error);
    });
}

$(document).ready(function () {
    loadGoogleAPI(signedIn, signedOut);
    $("#tocToggle").click(toggleToc);
    $("#bookmark").click(updateBookLocationRecord);
    // Automatically save location every minute
    setInterval(updateBookLocationRecord, 60000);
});