const { spawn } = require('child_process');
const http = require('http');
const assert = require('assert');

const TEST_PORT = 3009;
const SERVER_START_TIMEOUT = 10000; // 10 seconds

async function runTest() {
  let serverProcess;
  let testPassed = false;

  try {
    console.log('Starting server for HTTP transport integration test...');

    serverProcess = spawn('node', ['build/index.js'], {
      env: { ...process.env, MCP_HTTP_PORT: TEST_PORT.toString() },
      // stdio: 'pipe' // Use 'pipe' if you want to control stdio, otherwise 'inherit' can be useful for debugging
    });

    // Log server output for debugging
    serverProcess.stdout.on('data', (data) => {
      console.log(`Server STDOUT: ${data}`);
    });
    serverProcess.stderr.on('data', (data) => {
      console.error(`Server STDERR: ${data}`);
    });

    const serverStartedPromise = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Server failed to start within ${SERVER_START_TIMEOUT / 1000} seconds.`));
      }, SERVER_START_TIMEOUT);

      serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes(`Revit MCP Server also listening on HTTP at http://localhost:${TEST_PORT}`)) {
          clearTimeout(timeoutId);
          console.log('Server started successfully for HTTP test.');
          resolve();
        }
        if (output.includes('Port') && output.includes('is already in use')) {
          clearTimeout(timeoutId);
          reject(new Error(`Server port ${TEST_PORT} is already in use.`));
        }
      });

      serverProcess.stderr.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Error starting Revit MCP Server') || output.includes('Failed to start HTTP transport')) {
          clearTimeout(timeoutId);
          reject(new Error(`Server failed to start: ${output}`));
        }
         if (output.includes('Port') && output.includes('is already in use')) {
          clearTimeout(timeoutId);
          reject(new Error(`Server port ${TEST_PORT} is already in use (from stderr).`));
        }
      });

      serverProcess.on('error', (err) => {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to spawn server process: ${err.message}`));
      });

      serverProcess.on('exit', (code, signal) => {
        if (code !== 0 && signal !== 'SIGINT' && signal !== 'SIGTERM') { // SIGINT/SIGTERM is expected on successful shutdown
            // Only reject if it exits prematurely and unexpectedly
            if (!testPassed) { // Avoid rejection if test already passed and we are killing the server
                 clearTimeout(timeoutId);
                 reject(new Error(`Server process exited prematurely with code ${code} and signal ${signal}.`));
            }
        }
      });
    });

    await serverStartedPromise;

    console.log(`Making GET request to http://localhost:${TEST_PORT}/mcp`);

    await new Promise((resolve, reject) => {
      const req = http.get(`http://localhost:${TEST_PORT}/mcp`, (res) => {
        try {
          console.log('Received response from server.');
          assert.strictEqual(res.statusCode, 200, `Expected status code 200, got ${res.statusCode}`);
          console.log('Status code: OK');

          const contentType = res.headers['content-type'];
          assert.ok(contentType && contentType.includes('text/event-stream'), `Expected Content-Type 'text/event-stream', got '${contentType}'`);
          console.log('Content-Type: OK');

          testPassed = true;
          resolve();
        } catch (e) {
          reject(e);
        } finally {
          // IMPORTANT: Close the connection to allow the server/test to shut down cleanly.
          // SSE connections are kept alive by default.
          res.destroy(); 
        }
      });

      req.on('error', (err) => {
        console.error('HTTP request error:', err);
        reject(new Error(`HTTP request failed: ${err.message}`));
      });

      req.end();
    });

    console.log('HTTP transport integration test PASSED!');

  } catch (error) {
    console.error('HTTP transport integration test FAILED:');
    console.error(error);
    process.exitCode = 1; // Indicate test failure
  } finally {
    if (serverProcess) {
      console.log('Shutting down server...');
      const killed = serverProcess.kill('SIGINT'); // Send SIGINT to allow graceful shutdown if possible
      if(killed) console.log("SIGINT sent to server process.");
      else console.log("Failed to send SIGINT, process might have already exited or is unresponsive.");
      // Could add a timeout and force kill (SIGKILL) if SIGINT doesn't work
    }
  }
}

runTest();
