# Drive EPUB

Read EPUB files in Google Drive without downloading them!  
  
This app requests sensitive Drive OAuth scopes and cannot be run locally - you must install it on a server or hosting platform with a host name and SSL certificate, and configure the OAuth consent screen for your project. You must also set the client ID and api key in html/js/auth.js to enable access to your API.  

Required OAuth scopes:  
* ../auth/drive.file  
* ../auth/drive.appdata  

Drive integration:  
* Open URL: https://your.host/read.html  
* MIME type: application/epub+zip  
