## Creating a Self Signed Certificate

There is an issue with webpack dev server when you run with ssl enabled, the window would continually refresh, saying `[WDS] Disconnected`. This issue is solved by following instructions found in this <a href="https://github.com/angular/angular-cli/issues/4839#issuecomment-314608490">issue</a>.

- Navigate to this folder and run `node create-cert.js`
- This will create `server.crt` and `server.key`
- Open this folder in explorer and install certificate in the Trusted Root Certificate Store of local machine
- Close any open browser windows, reopen, and it should now not encounter the above error
