/*
 Hot reload function
 Reloads the current page anytime the file timestamp changes

 Detects when the application is installed in development mode. If it is, monitor all the timestamps in the Extension directory
 Any time the timestamp doesn't match the last one, reload the current tab.

 This feature is only available on Chrome. Use built-in tools available at about:debugging on Firefox for similar features.
 */
