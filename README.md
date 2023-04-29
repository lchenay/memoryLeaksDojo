This is a playground to test and learn memory leak detection in NodeJS


## Installation

Git clone the project

```bash
git clone https://github.com/lchenay/memoryLeaksDojo
npm ci
npm start
```

This will start automatically the project, with the inspector activated

## Debug using chrome

Then open chrome, and go to chrome://inspect

Play with memory capture to find all memory leaks.

## Files to optimize

You are allowed to play only with the following files:
* server.js
* client.js

All others one are not allowed to be modified, and should, in theory, not contain any memory leak.
