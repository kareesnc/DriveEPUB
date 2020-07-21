// Controls the rendering and interaction of the epub book

/* Opens a book from the body of a response, for example the GAPI call */
function openBook(responseBody, location) {
    // Load the opf
    var book = ePub();
    book.open(responseBody, "binary");

    // Determine height/width and render book viewer
    var width = document.getElementById("bookContent").offsetWidth;
    var height = document.getElementById("bookContent").offsetHeight-50; // save 50px for nav buttons
    var rendition = book.renderTo("viewer", {
        width: width+"px",
        height: height+"px",
        spread: "always"
    });
    if(location) {
        rendition.display(location);
    }
    else {
        // If location isn't specified
        rendition.display();
    }

    // Render book when ready
    book.ready.then(function () {
        // Show book area, hide loading spinner
        $("#book").css("visibility", "visible");
        $("#bookLoading").css("display", "none");
        $("#toc .btn").removeAttr("disabled");

        // Render book title to window and on-page header (if present)
        var title = book.package.metadata.title;
        if(!document.title.includes(' - '+title)) {
            document.title += ' - '+title;
        }
        $("#title").text(title);

        // Listeners for page navigation (on-page buttons, left/right arrows)
        $("#next").click(function (e) {
            book.package.metadata.direction === "rtl" ? rendition.prev() : rendition.next();
            e.preventDefault();
        });
        $("#prev").click(function (e) {
            book.package.metadata.direction === "rtl" ? rendition.next() : rendition.prev();
            e.preventDefault();
        });

        var keyListener = function (e) {
            if ((e.keyCode || e.which) == 37) { // Left Key
                book.package.metadata.direction === "rtl" ? rendition.next() : rendition.prev();
            }
            if ((e.keyCode || e.which) == 39) { // Right Key
                book.package.metadata.direction === "rtl" ? rendition.prev() : rendition.next();
            }
        };

        rendition.on("keyup", keyListener);
        $(document).on("keyup", keyListener);
    });

    // Event listeners (navigation, etc)

    book.loaded.navigation.then(function (toc) {
        // Render the table of contents
        var tocContainer = $("#tocList");
        toc.forEach(function(chapter) {
            var entry = $(document.createElement("a"));
            entry.attr("href","#");
            entry.attr("_loc",chapter.href);
            entry.attr("id",chapter.id);
            entry.text(chapter.label);
            entry.click(function() {
                rendition.display($(this).attr("_loc"));
            });
            tocContainer.append(entry);
        });
    });

    rendition.on("relocated", function (location) {
        // Enable/disable previous/next buttons when at start/end of book
        var next = book.package.metadata.direction === "rtl" ? $("#prev") : $("#next");
        var prev = book.package.metadata.direction === "rtl" ? $("#next") : $("#prev");

        if (location.atEnd) {
            next.attr("disabled","true");
        } else {
            next.removeAttr("disabled");
        }
        if (location.atStart) {
            prev.attr("disabled","true");
        } else {
            prev.removeAttr("disabled");
        }

        // Let the main script know about the new location
        if (typeof updateBookLocation === "function") { 
            updateBookLocation(location.start.cfi);
        }
        else {
            console.error("Could not call location data updater");
        }
    });

    rendition.on("layout", function (layout) {
        let viewer = document.getElementById("viewer");

        if (layout.spread) {
            viewer.classList.remove('single');
        } else {
            viewer.classList.add('single');
        }
    });

    window.addEventListener("unload", function () {
        if (this.book) {
            destroyBook(book);
        }
    });

    return book;
}

function destroyBook(book) {
    book.destroy();
    $("#tocList").html("");
    $("#next").unbind("click");
    $("#prev").unbind("click");
    $(document).unbind("keyup");
    $("#toc .btn").attr("disabled","true");
    $("#next").attr("disabled","true");
    $("#prev").attr("disabled","true");
}
