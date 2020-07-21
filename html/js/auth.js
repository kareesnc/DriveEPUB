/**
 * Create the auth object and load the auth2 library and API client library.
 * signInCallback/signOutCallback are called when the sign-in state changes.
 */
function loadGoogleAPI(signInCallback, signOutCallback) {
    var auth = new AuthDrive(signInCallback, signOutCallback);
    gapi.load("client:auth2", function () { auth.initClient(); });
}

class AuthDrive {

    constructor(signInCallback, signOutCallback) {
        this.clientID = 'TODO'; // OAuth client ID
        this.apiKey = 'TODO'; // Google Drive API key
        this.signInCallback = signInCallback;
        this.signOutCallback = signOutCallback;
        this.isSignedIn = false;

        // Array of API discovery doc URLs for APIs used by the quickstart
        this.discovery = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

        // Authorization scopes required by the API; multiple scopes can be included, separated by spaces. 
        const scopes = [
            "https://www.googleapis.com/auth/drive.install", // allows app to appear in the open with list
            "https://www.googleapis.com/auth/drive.file",    // allows access to specific files via open with, and to files created by the app
            "https://www.googleapis.com/auth/drive.appdata"  // access to app-specific data (https://developers.google.com/drive/api/v3/appdata)
        ]
        this.scopes = scopes.join(" ");
    }

    /**
     *  Initializes the API client library and sets up sign-in state listeners.
     */
    initClient() {
        var self = this;
        gapi.client.init({
            apiKey: this.apiKey,
            clientId: this.clientID,
            discoveryDocs: this.discovery,
            scope: this.scopes
        }).then(function () {
            // Listen for sign-in state changes.
            gapi.auth2.getAuthInstance().isSignedIn.listen(function () { self.updateSigninStatus(); });

            // Handle the initial sign-in state and add sign in/out listeners.
            self.updateSigninStatus();
            $("#authorize_button").click(self.handleAuthClick);
            $("#signout_button").click(self.handleSignoutClick);
        }, function (error) {
            console.log(JSON.stringify(error, null, 2));
        });
    }

    /**
     *  Called when the signed in status changes, to update the UI
     *  appropriately. After a sign-in, the API is called.
     */
    updateSigninStatus() {
        this.isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
        if (this.isSignedIn) {
            $(".authorize").css("display","none");
            $(".signout").css("display","inline-block");
            if (typeof this.signInCallback === "function") { 
                this.signInCallback();
            }
        } else {
            $(".authorize").css("display","inline-block");
            $(".signout").css("display","none");
            if (typeof this.signOutCallback === "function") { 
                this.signOutCallback();
            }
        }
    }

    /**
     *  Sign in the user upon button click.
     */
    handleAuthClick(event) {
        gapi.auth2.getAuthInstance().signIn();
        console.log("Signed In");
    }

    /**
     *  Sign out the user upon button click.
     */
    handleSignoutClick(event) {
        gapi.auth2.getAuthInstance().signOut();
        console.log("Signed Out");
    }

}