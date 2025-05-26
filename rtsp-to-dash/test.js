const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const BASE_URL = 'http://localhost:3033';
const TEST_RTSP_URL = 'rtsp://example.com/test';
const DASH_DIR = path.join(__dirname, 'dash');

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
    console.log('Starting tests...\n');
    let testsPassed = 0;
    let totalTests = 0;

    async function runTest(name, testFn) {
        totalTests++;
        try {
            process.stdout.write(`Running test: ${name}... `);
            await testFn();
            console.log('✓ PASSED');
            testsPassed++;
        } catch (error) {
            console.log('✗ FAILED');
            console.error(`Error: ${error.message}\n`);
        }
    }

    // Test 1: Server Availability
    await runTest('Server Availability', async () => {
        const response = await axios.get(BASE_URL);
        if (response.status !== 200) {
            throw new Error(`Server returned status ${response.status}`);
        }
    });

    // Test 2: Dash Directory Exists
    await runTest('Dash Directory Check', () => {
        if (!fs.existsSync(DASH_DIR)) {
            throw new Error('Dash directory does not exist');
        }
    });

    // Test 3: Convert API Input Validation
    await runTest('Convert API Validation', async () => {
        try {
            await axios.post(`${BASE_URL}/convert`, { rtspUrl: 'invalid-url' });
            throw new Error('Should have rejected invalid URL');
        } catch (error) {
            if (error.response?.status !== 400) {
                throw error;
            }
        }
    });

    // Test 4: Convert API Response
    await runTest('Convert API Response', async () => {
        const response = await axios.post(`${BASE_URL}/convert`, { rtspUrl: TEST_RTSP_URL });
        if (response.status !== 200 || !response.data.message) {
            throw new Error('Invalid response from convert API');
        }
    });

    // Test 5: MPD File Generation
    await runTest('MPD File Generation', async () => {
        // Wait for FFmpeg to generate files
        await wait(2000);
        const mpdPath = path.join(DASH_DIR, 'stream.mpd');
        if (!fs.existsSync(mpdPath)) {
            throw new Error('MPD file was not generated');
        }
    });

    // Test 6: Segment Files Generation
    await runTest('Segment Files Generation', async () => {
        // Wait for segments to be generated
        await wait(2000);
        const files = fs.readdirSync(DASH_DIR);
        const segments = files.filter(f => f.endsWith('.m4s'));
        if (segments.length === 0) {
            throw new Error('No segment files were generated');
        }
    });

    // Test 7: Static File Serving
    await runTest('Static File Serving', async () => {
        const response = await axios.get(`${BASE_URL}/dash/stream.mpd`);
        if (response.status !== 200) {
            throw new Error('MPD file is not being served correctly');
        }
    });

    // Test 8: Process Management
    await runTest('Process Management', async () => {
        // Start two conversions to test process cleanup
        await axios.post(`${BASE_URL}/convert`, { rtspUrl: TEST_RTSP_URL });
        await wait(1000);
        await axios.post(`${BASE_URL}/convert`, { rtspUrl: TEST_RTSP_URL });
        
        // Check if only one ffmpeg process is running
        const ps = spawn('ps', ['aux']);
        return new Promise((resolve, reject) => {
            let output = '';
            ps.stdout.on('data', (data) => {
                output += data.toString();
            });
            ps.on('close', () => {
                const ffmpegCount = output.split('\n')
                    .filter(line => line.includes('ffmpeg'))
                    .length;
                if (ffmpegCount > 1) {
                    reject(new Error('Multiple FFmpeg processes detected'));
                } else {
                    resolve();
                }
            });
        });
    });

    // Print test summary
    console.log('\nTest Summary:');
    console.log(`Passed: ${testsPassed}/${totalTests} tests`);
    console.log(`Success Rate: ${((testsPassed/totalTests) * 100).toFixed(1)}%`);

    if (testsPassed === totalTests) {
        console.log('\n✓ All tests passed successfully!');
    } else {
        console.log('\n✗ Some tests failed. Please check the output above.');
    }
}

// Run tests
console.log('RTSP to DASH Converter Test Suite\n');
runTests().catch(console.error);
