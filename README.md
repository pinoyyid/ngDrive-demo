## Notes

If you clone this directory, you will be able to run the test apps on your own PC.
You will need to:-

 * Make sure you have a project defined on Google API Console.
 * Edit minimal.html or app.js (or both, depending on which of the two test apps you want to run) to contain your own Client ID.
 * Run a web server in the parent directory, on a URL defined in your Google API Console as one of the origins for your JavaScript client. ` python -m SimpleHTTPServer` works well.
 * Browse to http://mydevserver.me/demo_app/maximal.html for a web page that exercises all of the Drive calls,
  or http://mydevserver.me/demo_app/minimal.html for the simple test app that simply lists files.

### Testing without user intervention

 If you create a file `credentials.js` containing ...
 ```
 var refreshToken = '1/IrX_WI9yVw2LF8cudVrK5jSpoR30zcRFq6';
 var clientSecret = 'Y_vhMLV9wUrhq';
 ```
... , and include this in with a script tag, you will also be able to run the e2e testing version of the test app at http://mydevserver.me/maximalo.html .
MAKE SURE THIS CREDENTIAL FILE IS IGNORED BY GIT
