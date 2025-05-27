// Game variables
let currentGame = null; // 'dino' or 'flappy'
let score = 0;
let gameActive = false;
let canvas, ctx;
let animationFrameId;

// Hand gesture detection variables
let handposeModel;
let webcam;
let lastGesture = 'none';
let webcamInitialized = false;

// Game elements
const dinoGame = {
    dino: {
        x: 50,
        y: 350,
        width: 60,
        height: 60,
        jumpHeight: 150,
        isJumping: false,
        isDucking: false,
        velocity: 0,
        gravity: 0.8
    },
    obstacles: [],
    bgObjects: [],
    obstacleTimer: 0,
    obstacleInterval: 100,
    speed: 5,
    ground: {
        y: 400
    }
};

const flappyGame = {
    bird: {
        x: 150,
        y: 200,
        width: 40,
        height: 30,
        velocity: 0,
        gravity: 0.4,
        lift: -8
    },
    pipes: [],
    pipeTimer: 0,
    pipeInterval: 120,
    gap: 150,
    pipeWidth: 60
};

// DOM elements
const menuScreen = document.getElementById('menu-screen');
const gameScreen = document.getElementById('game-screen');
const dinoGameBtn = document.getElementById('dino-game-btn');
const flappyGameBtn = document.getElementById('flappy-game-btn');
const backToMenuBtn = document.getElementById('back-to-menu');
const scoreDisplay = document.getElementById('score-display');
const gestureDisplay = document.getElementById('gesture-display');
const webcamStatus = document.getElementById('webcam-status');
const webcamPermissionBtn = document.getElementById('webcam-permission');
const debugWebcamBtn = document.getElementById('debug-webcam');
const webcamPreviewContainer = document.getElementById('webcam-preview-container');
document.getElementById('reset-game').addEventListener('click', emergencyReset);

// Initialize the game
async function init() {

    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 800;
    canvas.height = 400;
    
    // Add event listeners
    dinoGameBtn.addEventListener('click', () => startGame('dino'));
    flappyGameBtn.addEventListener('click', () => startGame('flappy'));
    backToMenuBtn.addEventListener('click', backToMenu);
    
    // Add webcam permission button handler
    webcamPermissionBtn.addEventListener('click', initWebcam);

    //calibration handler 
    // Add this to your init() function
    const calibrateBtn = document.getElementById('calibrate-gestures');
    if (calibrateBtn) {
        calibrateBtn.addEventListener('click', () => {
        if (webcamInitialized) {
            calibrateGestures();
        } else {
            alert('Please enable webcam first before calibrating gestures');
        }
    });
}

    
    
    // Add debug button handler
    debugWebcamBtn.addEventListener('click', debugWebcam);
    
    // Load handpose model in background
    try {
        webcamStatus.textContent = 'Loading hand detection model...';
        handposeModel = await handpose.load();
        webcamStatus.textContent = 'Model loaded! Click "Enable Webcam" to start.';
    } catch (error) {
        console.error('Error loading handpose model:', error);
        webcamStatus.textContent = 'Error loading model. Try reloading the page.';
    }
}

// Initialize webcam with user permission
async function initWebcam() {
    if (webcamInitialized) return;
    
    try {
        webcamStatus.textContent = 'Requesting webcam access...';
        webcam = await setupWebcam();
        
        // Add webcam preview
        addWebcamPreview(webcam);
        
        webcamStatus.textContent = 'Webcam active! Ready to play.';
        webcamPermissionBtn.style.display = 'none';
        
        // Start hand tracking
        detectHands();
        webcamInitialized = true;
    } catch (error) {
        console.error('Webcam setup error:', error);
        webcamStatus.textContent = `Error: ${error.message}`;
    }
}

// Setup webcam with better error handling
async function setupWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                width: 640, 
                height: 480,
                facingMode: 'user' 
            }
        });
        
        const video = document.createElement('video');
        video.srcObject = stream;
        video.id = 'webcam';
        video.style.display = 'none';
        document.body.appendChild(video);
        
        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                video.play().then(() => resolve(video));
            };
        });
    } catch (error) {
        if (error.name === 'NotAllowedError') {
            throw new Error('Camera access denied. Please allow camera access and try again.');
        } else if (error.name === 'NotFoundError') {
            throw new Error('No webcam detected. Please connect a webcam and try again.');
        } else {
            throw new Error(`Webcam error: ${error.message}`);
        }
    }
}

// Add webcam preview
function addWebcamPreview(video) {
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = 160;
    previewCanvas.height = 120;
    previewCanvas.classList.add('webcam-preview');
    webcamPreviewContainer.appendChild(previewCanvas);
    
    const previewCtx = previewCanvas.getContext('2d');
    
    function updatePreview() {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            previewCtx.drawImage(video, 0, 0, previewCanvas.width, previewCanvas.height);
        }
        requestAnimationFrame(updatePreview);
    }
    
    updatePreview();
}



// Debug webcam
async function debugWebcam() {
    try {
        webcamStatus.textContent = 'Testing webcam access...';
        
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true
        });
        
        // Create a visible test video
        const testVideo = document.createElement('video');
        testVideo.srcObject = stream;
        testVideo.style.position = 'absolute';
        testVideo.style.right = '20px';
        testVideo.style.top = '20px';
        testVideo.style.width = '240px';
        testVideo.style.height = '180px';
        testVideo.style.border = '2px solid white';
        testVideo.style.zIndex = '1000';
        testVideo.style.borderRadius = '8px';
        testVideo.autoplay = true;
        testVideo.id = 'test-video';
        
        document.body.appendChild(testVideo);
        
        webcamStatus.textContent = 'Webcam test successful! See preview in corner.';
        
        // Add a close button for the test video
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'X';
        closeBtn.style.position = 'absolute';
        closeBtn.style.right = '20px';
        closeBtn.style.top = '20px';
        closeBtn.style.zIndex = '1001';
        closeBtn.style.background = 'red';
        closeBtn.style.color = 'white';
        closeBtn.style.border = 'none';
        closeBtn.style.borderRadius = '50%';
        closeBtn.style.width = '25px';
        closeBtn.style.height = '25px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontSize = '12px';
        closeBtn.style.lineHeight = '1';
        closeBtn.style.display = 'flex';
        closeBtn.style.justifyContent = 'center';
        closeBtn.style.alignItems = 'center';
        
        closeBtn.onclick = () => {
            testVideo.remove();
            closeBtn.remove();
            stream.getTracks().forEach(track => track.stop());
        };
        
        document.body.appendChild(closeBtn);
        
    } catch (error) {
        webcamStatus.textContent = `Webcam test failed: ${error.message}`;
        console.error('Webcam test error:', error);
    }
}

// Gesture calibration system
function calibrateGestures() {
    // Create overlay for calibration
    const overlay = document.createElement('div');
    overlay.className = 'calibration-overlay';
    overlay.innerHTML = `
        <div class="calibration-container">
            <h2>Gesture Calibration</h2>
            <div class="calibration-view">
                <canvas id="calibration-canvas" width="320" height="240"></canvas>
                <div class="hand-outline"></div>
            </div>
            <div class="calibration-step" id="calibration-step">
                <div class="step-number">Step 1/2</div>
                <div class="step-instruction">
                    <div class="instruction-icon">👆</div>
                    <div class="instruction-text">Show your INDEX FINGER only</div>
                </div>
            </div>
            <div class="calibration-progress">
                <div class="progress-bar">
                    <div class="progress-fill" id="calibration-progress"></div>
                </div>
                <div class="progress-text" id="calibration-countdown">5</div>
            </div>
            <button class="cancel-btn" id="cancel-calibration">Cancel</button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Add styles for calibration UI
    const style = document.createElement('style');
    style.textContent = `
        .calibration-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            backdrop-filter: blur(5px);
        }
        
        .calibration-container {
            background-color: white;
            border-radius: 20px;
            padding: 30px;
            width: 90%;
            max-width: 500px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .calibration-container h2 {
            color: #333;
            margin-bottom: 20px;
            font-size: 24px;
        }
        
        .calibration-view {
            position: relative;
            width: 320px;
            height: 240px;
            margin: 0 auto 20px;
            border-radius: 10px;
            overflow: hidden;
            border: 2px solid #ddd;
        }
        
        #calibration-canvas {
            background-color: #f5f5f5;
        }
        
        .hand-outline {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="none" stroke="rgba(33, 150, 243, 0.7)" stroke-width="2" d="M50,30 C60,30 65,40 65,50 C65,60 60,70 50,70 C40,70 35,60 35,50 C35,40 40,30 50,30 Z" /></svg>');
            background-position: center;
            background-repeat: no-repeat;
            background-size: 50%;
            opacity: 0.7;
        }
        
        .calibration-step {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f5f7fa;
            border-radius: 10px;
        }
        
        .step-number {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
        }
        
        .step-instruction {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
        }
        
        .instruction-icon {
            font-size: 32px;
        }
        
        .instruction-text {
            font-size: 18px;
            font-weight: 600;
            color: #333;
        }
        
        .calibration-progress {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .progress-bar {
            flex: 1;
            height: 8px;
            background-color: #eee;
            border-radius: 4px;
            overflow: hidden;
            margin-right: 15px;
        }
        
        .progress-fill {
            height: 100%;
            background-color: #2196f3;
            width: 0%;
            transition: width 0.1s linear;
        }
        
        .progress-text {
            font-size: 18px;
            font-weight: 600;
            color: #2196f3;
            width: 30px;
            text-align: center;
        }
        
        .cancel-btn {
            background-color: transparent;
            border: 2px solid #e74c3c;
            color: #e74c3c;
            border-radius: 30px;
            padding: 10px 20px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .cancel-btn:hover {
            background-color: #fff8f8;
        }
    `;
    document.head.appendChild(style);
    
    // Setup webcam preview in canvas
    const calibrationCanvas = document.getElementById('calibration-canvas');
    const calibrationCtx = calibrationCanvas.getContext('2d');
    const progressFill = document.getElementById('calibration-progress');
    const countdownElement = document.getElementById('calibration-countdown');
    const stepElement = document.getElementById('calibration-step');
    
    // Cancel button
    document.getElementById('cancel-calibration').addEventListener('click', () => {
        overlay.remove();
        style.remove();
        clearInterval(countdownInterval);
    });
    
    // Initialize calibration data
    const calibrationData = {
        indexFinger: null,
        twoFingers: null,
        currentStep: 1,
        countdown: 5
    };
    
    // Update webcam preview
    function updateCalibrationPreview() {
        if (webcam && webcam.readyState === webcam.HAVE_ENOUGH_DATA) {
            calibrationCtx.drawImage(webcam, 0, 0, calibrationCanvas.width, calibrationCanvas.height);
        }
        
        // Draw hand landmarks if available
        if (window.lastPrediction && window.lastPrediction.landmarks) {
            drawHandLandmarks(calibrationCtx, window.lastPrediction.landmarks, calibrationCanvas);
        }
        
        if (document.getElementById('calibration-canvas')) {
            requestAnimationFrame(updateCalibrationPreview);
        }
    }
    
    // Start preview
    updateCalibrationPreview();
    
    // Countdown interval
    let countdownInterval = setInterval(() => {
        calibrationData.countdown--;
        countdownElement.textContent = calibrationData.countdown;
        
        // Update progress bar
        const progressPercent = 100 - (calibrationData.countdown / 5) * 100;
        progressFill.style.width = `${progressPercent}%`;
        
        if (calibrationData.countdown <= 0) {
            handleStepComplete();
        }
    }, 1000);
    
    // Function to handle step completion
    function handleStepComplete() {
        if (calibrationData.currentStep === 1) {
            // Capture data for index finger
            captureGestureData('indexFinger').then(success => {
                if (success) {
                    // Move to step 2
                    calibrationData.currentStep = 2;
                    calibrationData.countdown = 5;
                    countdownElement.textContent = '5';
                    progressFill.style.width = '0%';
                    
                    // Update step UI
                    stepElement.innerHTML = `
                        <div class="step-number">Step 2/2</div>
                        <div class="step-instruction">
                            <div class="instruction-icon">✌️</div>
                            <div class="instruction-text">Show your INDEX + MIDDLE fingers</div>
                        </div>
                    `;
                } else {
                    // Failed to capture, reset countdown
                    calibrationData.countdown = 5;
                    countdownElement.textContent = '5';
                    progressFill.style.width = '0%';
                    
                    // Show error
                    showCalibrationMessage('No hand detected! Try again.', 'error');
                }
            });
        } else {
            // Capture data for two fingers
            captureGestureData('twoFingers').then(success => {
                if (success) {
                    // Complete calibration
                    clearInterval(countdownInterval);
                    
                    // Save calibration data
                    saveCalibrationData(calibrationData);
                    
                    // Show success message
                    showCalibrationMessage('Calibration complete!', 'success');
                    
                    // Close overlay after delay
                    setTimeout(() => {
                        overlay.remove();
                        style.remove();
                    }, 2000);
                } else {
                    // Failed to capture, reset countdown
                    calibrationData.countdown = 5;
                    countdownElement.textContent = '5';
                    progressFill.style.width = '0%';
                    
                    // Show error
                    showCalibrationMessage('No hand detected! Try again.', 'error');
                }
            });
        }
    }
    
    // Function to capture gesture data
    async function captureGestureData(gestureName) {
        try {
            // Detect hand
            const predictions = await handposeModel.estimateHands(webcam);
            
            if (predictions.length > 0) {
                // Store the prediction data
                window.lastPrediction = predictions[0];
                
                // Extract finger positions
                const fingerData = {
                    landmarks: predictions[0].landmarks,
                    indexTip: predictions[0].landmarks[8],
                    indexBase: predictions[0].landmarks[5],
                    middleTip: predictions[0].landmarks[12],
                    middleBase: predictions[0].landmarks[9]
                };
                
                // Save to calibration data
                calibrationData[gestureName] = fingerData;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error during calibration:', error);
            return false;
        }
    }
    
    // Function to save calibration data
    function saveCalibrationData(data) {
        // Store in localStorage for persistence
        try {
            localStorage.setItem('gestureCalibration', JSON.stringify({
                indexFinger: {
                    indexTipY: data.indexFinger.indexTip[1],
                    indexBaseY: data.indexFinger.indexBase[1]
                },
                twoFingers: {
                    indexTipY: data.twoFingers.indexTip[1],
                    indexBaseY: data.twoFingers.indexBase[1],
                    middleTipY: data.twoFingers.middleTip[1],
                    middleBaseY: data.twoFingers.middleBase[1]
                },
                timestamp: Date.now()
            }));
            
            // Update the GESTURE_CONFIG with new values
            window.GESTURE_CONFIG = {
                INDEX_FINGER_THRESHOLD: Math.abs(data.indexFinger.indexTip[1] - data.indexFinger.indexBase[1]) * 0.7,
                TWO_FINGER_THRESHOLD: Math.abs(data.twoFingers.middleTip[1] - data.twoFingers.middleBase[1]) * 0.7
            };
            
            console.log('Gesture calibration saved:', window.GESTURE_CONFIG);
        } catch (error) {
            console.error('Error saving calibration data:', error);
        }
    }
    
    // Function to display messages
    function showCalibrationMessage(message, type = 'info') {
        const messageElement = document.createElement('div');
        messageElement.className = `calibration-message ${type}`;
        messageElement.textContent = message;
        messageElement.style.cssText = `
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 10px 20px;
            border-radius: 30px;
            color: white;
            font-weight: 500;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            z-index: 10;
        `;
        
        // Set color based on type
        if (type === 'error') {
            messageElement.style.backgroundColor = '#e74c3c';
        } else if (type === 'success') {
            messageElement.style.backgroundColor = '#2ecc71';
        } else {
            messageElement.style.backgroundColor = '#3498db';
        }
        
        document.querySelector('.calibration-container').appendChild(messageElement);
        
        // Remove after delay
        setTimeout(() => {
            messageElement.remove();
        }, 3000);
    }
    
    // Function to draw hand landmarks on a canvas
    function drawHandLandmarks(ctx, landmarks, canvas) {
        ctx.fillStyle = 'rgba(33, 150, 243, 0.5)';
        ctx.strokeStyle = 'rgba(33, 150, 243, 0.8)';
        ctx.lineWidth = 2;
        
        // Scale factors for the canvas
        const scaleX = canvas.width / webcam.videoWidth;
        const scaleY = canvas.height / webcam.videoHeight;
        
        // Draw connections between landmarks
        const fingerConnections = [
            // Thumb
            [0, 1], [1, 2], [2, 3], [3, 4],
            // Index finger
            [0, 5], [5, 6], [6, 7], [7, 8],
            // Middle finger
            [5, 9], [9, 10], [10, 11], [11, 12],
            // Ring finger
            [9, 13], [13, 14], [14, 15], [15, 16],
            // Pinky
            [13, 17], [17, 18], [18, 19], [19, 20],
            // Palm
            [0, 5], [5, 9], [9, 13], [13, 17]
        ];
        
        for (const [start, end] of fingerConnections) {
            const startPoint = landmarks[start];
            const endPoint = landmarks[end];
            
            ctx.beginPath();
            ctx.moveTo(startPoint[0] * scaleX, startPoint[1] * scaleY);
            ctx.lineTo(endPoint[0] * scaleX, endPoint[1] * scaleY);
            ctx.stroke();
        }
        
        // Draw landmarks
        for (let i = 0; i < landmarks.length; i++) {
            const [x, y] = landmarks[i];
            
            ctx.beginPath();
            ctx.arc(x * scaleX, y * scaleY, i % 4 === 0 ? 6 : 3, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // Highlight fingertips with larger dots
        const fingertips = [4, 8, 12, 16, 20]; // Thumb, index, middle, ring, pinky
        for (const i of fingertips) {
            const [x, y] = landmarks[i];
            
            ctx.fillStyle = i === 8 ? 'rgba(255, 193, 7, 0.8)' : // Index in yellow
                             i === 12 ? 'rgba(76, 175, 80, 0.8)' : // Middle in green
                             'rgba(33, 150, 243, 0.8)'; // Others in blue
            
            ctx.beginPath();
            ctx.arc(x * scaleX, y * scaleY, 8, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}

// Improved hand detection
async function detectHands() {
    if (!handposeModel || !webcam || !webcamInitialized) {
        requestAnimationFrame(detectHands);
        return;
    }
    
    try {
        const predictions = await handposeModel.estimateHands(webcam);
        
        if (predictions.length > 0) {
            // Visualize hand landmarks for debugging (optional)
            if (window.debugMode) {
                drawHandLandmarks(predictions[0].landmarks);
            }
            
            const gesture = detectGesture(predictions[0].landmarks);
            lastGesture = gesture;
            
            // Update UI
            if (gesture === 'index') {
                gestureDisplay.textContent = 'Gesture: Jump/Fly Up';
                gestureDisplay.style.backgroundColor = 'rgba(46, 204, 113, 0.8)'; // Green
            } else if (gesture === 'index+middle') {
                gestureDisplay.textContent = 'Gesture: Duck/Fly Down';
                gestureDisplay.style.backgroundColor = 'rgba(52, 152, 219, 0.8)'; // Blue
            } else {
                gestureDisplay.textContent = 'Gesture: None';
                gestureDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'; // Black
            }
        } else {
            lastGesture = 'none';
            gestureDisplay.textContent = 'Gesture: No hand detected';
            gestureDisplay.style.backgroundColor = 'rgba(231, 76, 60, 0.8)'; // Red
        }
    } catch (error) {
        console.error('Hand detection error:', error);
    }
    
    // Continue detection
    requestAnimationFrame(detectHands);
}

// Improved gesture detection function
function detectGesture(landmarks) {
    // Get calibration data or use defaults
    const config = window.GESTURE_CONFIG || {
        INDEX_FINGER_THRESHOLD: 40,
        TWO_FINGER_THRESHOLD: 40
    };
    
    // Finger landmark indices
    const indexTip = landmarks[8];
    const indexBase = landmarks[5];
    const middleTip = landmarks[12];
    const middleBase = landmarks[9];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    
    // Calculate if fingers are raised using calibrated values
    const indexRaised = (indexBase[1] - indexTip[1]) > config.INDEX_FINGER_THRESHOLD;
    const middleRaised = (middleBase[1] - middleTip[1]) > config.TWO_FINGER_THRESHOLD;
    
    // Check if other fingers are curled (not raised)
    const ringCurled = (ringTip[1] - middleBase[1]) < 10;
    const pinkyCurled = (pinkyTip[1] - middleBase[1]) < 10;
    
    // Determine gesture based on finger positions
    if (indexRaised && !middleRaised) {
        return 'index'; // Just index finger
    } else if (indexRaised && middleRaised) {
        return 'index+middle'; // Index and middle fingers
    } else {
        return 'none';
    }
}
// Add this function to visualize hand landmarks for debugging
function drawHandLandmarks(landmarks) {
    if (!ctx) return;
    
    // Draw on a separate canvas overlay
    let debugCanvas = document.getElementById('debug-canvas');
    if (!debugCanvas) {
        debugCanvas = document.createElement('canvas');
        debugCanvas.id = 'debug-canvas';
        debugCanvas.width = canvas.width;
        debugCanvas.height = canvas.height;
        debugCanvas.style.position = 'absolute';
        debugCanvas.style.top = canvas.offsetTop + 'px';
        debugCanvas.style.left = canvas.offsetLeft + 'px';
        debugCanvas.style.pointerEvents = 'none';
        canvas.parentNode.appendChild(debugCanvas);
    }
    
    const debugCtx = debugCanvas.getContext('2d');
    debugCtx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);
    
    // Draw connections
    debugCtx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    debugCtx.lineWidth = 2;
    
    // Draw dots at landmarks
    for (let i = 0; i < landmarks.length; i++) {
        const [x, y] = landmarks[i];
        
        // Scale coordinates to canvas size
        const canvasX = x * canvas.width / 640;
        const canvasY = y * canvas.height / 480;
        
        debugCtx.fillStyle = i === 8 || i === 12 ? 'yellow' : 'white'; // Highlight index and middle fingertips
        debugCtx.beginPath();
        debugCtx.arc(canvasX, canvasY, i % 4 === 0 ? 6 : 3, 0, 2 * Math.PI);
        debugCtx.fill();
        
        // Label fingertips
        if (i === 8) {
            debugCtx.fillText('index', canvasX + 10, canvasY);
        } else if (i === 12) {
            debugCtx.fillText('middle', canvasX + 10, canvasY);
        }
    }
}
// Start game
function startGame(gameType) {
    if (!webcamInitialized) {
        webcamStatus.textContent = 'Please enable webcam before playing!';
        return;
    }
    
    menuScreen.classList.remove('active');
    gameScreen.classList.add('active');
    
    currentGame = gameType;
    score = 0;
    gameActive = true;
    
    if (gameType === 'dino') {
        resetDinoGame();
    } else {
        resetFlappyGame();
    }
    
    // Start game loop
    gameLoop();
}

// Game loop
function gameLoop() {
    try {
        // Clear the entire canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (currentGame === 'dino') {
            updateDinoGame();
            drawDinoGame();
        } else {
            updateFlappyGame();
            drawFlappyGame();
        }
        
        // Update score
        score++;
        scoreDisplay.textContent = `Score: ${score}`;
        
        // Check for game switch
        if (score >= 2000 && currentGame === 'dino') {
            currentGame = 'flappy';
            resetFlappyGame();
        }
        
        // Continue game loop if active
        if (gameActive) {
            animationFrameId = requestAnimationFrame(gameLoop);
        }
    } catch (error) {
        console.error("Game loop error:", error);
        
        // Recovery attempt - reset the current game
        if (currentGame === 'dino') {
            console.log("Resetting dino game due to error");
            resetDinoGame();
        } else {
            console.log("Resetting flappy game due to error");
            resetFlappyGame();
        }
        
        // Continue game loop to recover
        if (gameActive) {
            animationFrameId = requestAnimationFrame(gameLoop);
        }
    }
}
// Go back to menu
function backToMenu() {
    gameActive = false;
    cancelAnimationFrame(animationFrameId);
    
    gameScreen.classList.remove('active');
    menuScreen.classList.add('active');
}

function gameOver() {
    gameActive = false;
    
    // Create game over overlay
    const gameOverDiv = document.createElement('div');
    gameOverDiv.className = 'game-over-overlay';
    
    // Create game over card with content
    gameOverDiv.innerHTML = `
        <div class="game-over-card animate-pop">
            <h2 class="game-over-title">Game Over</h2>
            <div class="game-over-score">Your Score: ${score}</div>
            <button class="play-again-btn">Play Again</button>
        </div>
    `;
    
    // Add to game screen
    gameScreen.appendChild(gameOverDiv);
    
    // Add event listener to retry button
    gameOverDiv.querySelector('.play-again-btn').addEventListener('click', () => {
        gameOverDiv.remove();
        startGame(currentGame);
    });
    
    // Optional: Show webcam preview in game over screen
    const webcamPreview = document.querySelector('.webcam-preview');
    if (webcamPreview) {
        const previewClone = webcamPreview.cloneNode(true);
        previewClone.style.width = '120px';
        previewClone.style.height = '90px';
        previewClone.style.margin = '10px auto';
        gameOverDiv.querySelector('.game-over-card').insertBefore(
            previewClone, 
            gameOverDiv.querySelector('.play-again-btn')
        );
    }
}

// Reset Dino Game
function resetDinoGame() {
    dinoGame.dino.y = 350;
    dinoGame.dino.isJumping = false;
    dinoGame.dino.isDucking = false;
    dinoGame.dino.velocity = 0;
    dinoGame.obstacles = [];
    dinoGame.bgObjects = [];
    dinoGame.obstacleTimer = 0;
    dinoGame.speed = 5;
}

// Reset Flappy Bird Game
function resetFlappyGame() {
    flappyGame.bird.y = 200;
    flappyGame.bird.velocity = 0;
    flappyGame.pipes = [];
    flappyGame.pipeTimer = 0;
}

// Update Dino Game
function updateDinoGame() {
    const dino = dinoGame.dino;
    
    // Handle gestures
    if (lastGesture === 'index' && !dino.isJumping && !dino.isDucking) {
        dino.isJumping = true;
        dino.velocity = -15;
    } else if (lastGesture === 'index+middle') {
        dino.isDucking = true;
        if (dino.height !== 30) {
            dino.height = 30;
            dino.y = 380; // Adjust position when ducking
        }
    } else if (dino.isDucking && lastGesture !== 'index+middle') {
        dino.isDucking = false;
        dino.height = 60;
        dino.y = 350; // Reset position
    }
    
    // Apply physics if jumping
    if (dino.isJumping) {
        dino.y += dino.velocity;
        dino.velocity += dino.gravity;
        
        // Check if landed
        if (dino.y >= 350) {
            dino.y = 350;
            dino.isJumping = false;
            dino.velocity = 0;
        }
    }
    
    // Spawn obstacles
    dinoGame.obstacleTimer++;
    if (dinoGame.obstacleTimer >= dinoGame.obstacleInterval) {
        dinoGame.obstacleTimer = 0;
        dinoGame.obstacleInterval = 70 + Math.random() * 100;
        
        // Randomly choose between cactus and bird
        const isBird = Math.random() > 0.7;
        
        if (isBird) {
            // Flying bird obstacle
            dinoGame.obstacles.push({
                x: canvas.width,
                y: 300 - Math.random() * 100,
                width: 50,
                height: 40,
                type: 'bird'
            });
        } else {
            // Cactus obstacle
            const height = 50 + Math.random() * 40;
            dinoGame.obstacles.push({
                x: canvas.width,
                y: 410 - height,
                width: 30,
                height: height,
                type: 'cactus'
            });
        }
    }
    
    // Move obstacles
    for (let i = dinoGame.obstacles.length - 1; i >= 0; i--) {
        dinoGame.obstacles[i].x -= dinoGame.speed;
        
        // Remove if off screen
        if (dinoGame.obstacles[i].x + dinoGame.obstacles[i].width < 0) {
            dinoGame.obstacles.splice(i, 1);
        }
        
        // Check collision
        if (checkCollision(dino, dinoGame.obstacles[i])) {
            gameOver();
        }
    }
    
    // Spawn background objects occasionally
    if (Math.random() < 0.01) {
        dinoGame.bgObjects.push({
            x: canvas.width,
            y: 370 - Math.random() * 20,
            size: 5 + Math.random() * 10
        });
    }
    
    // Move background objects
    for (let i = dinoGame.bgObjects.length - 1; i >= 0; i--) {
        dinoGame.bgObjects[i].x -= dinoGame.speed * 0.5;
        
        // Remove if off screen
        if (dinoGame.bgObjects[i].x < 0) {
            dinoGame.bgObjects.splice(i, 1);
        }
    }
    
    // Increase speed gradually
    if (score % 500 === 0 && score > 0) {
        dinoGame.speed += 0.5;
    }
}

// Update Flappy Bird Game
function updateFlappyGame() {
    const bird = flappyGame.bird;
    
    // Handle gestures
    if (lastGesture === 'index') {
        bird.velocity = bird.lift;
    }
    
    // Apply physics
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;
    
    // Keep bird in bounds
    if (bird.y < 0) {
        bird.y = 0;
        bird.velocity = 0;
    }
    
    if (bird.y + bird.height > canvas.height) {
        gameOver();
    }
    
    // Spawn pipes
    flappyGame.pipeTimer++;
    if (flappyGame.pipeTimer >= flappyGame.pipeInterval) {
        flappyGame.pipeTimer = 0;
        
        const gapPosition = 100 + Math.random() * (canvas.height - flappyGame.gap - 200);
        
        // Top pipe
        flappyGame.pipes.push({
            x: canvas.width,
            y: 0,
            width: flappyGame.pipeWidth,
            height: gapPosition,
            passed: false
        });
        
        // Bottom pipe
        flappyGame.pipes.push({
            x: canvas.width,
            y: gapPosition + flappyGame.gap,
            width: flappyGame.pipeWidth,
            height: canvas.height - (gapPosition + flappyGame.gap),
            passed: false
        });
    }
    
    // Move and check pipes
    for (let i = flappyGame.pipes.length - 1; i >= 0; i--) {
        const pipe = flappyGame.pipes[i];
        pipe.x -= 5;
        
        // Check collision
        if (checkCollision(bird, pipe)) {
            gameOver();
        }
        
        // Check if passed middle of screen for points
        if (!pipe.passed && pipe.x + pipe.width < bird.x) {
            pipe.passed = true;
            // Only count one pipe of the pair for score
            if (i % 2 === 0) {
                score += 10;
            }
        }
        
        // Remove if off screen
        if (pipe.x + pipe.width < 0) {
            flappyGame.pipes.splice(i, 1);
        }
    }
}

// Draw Dino Game
function drawDinoGame() {
    // Draw sky background
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw ground
    ctx.fillStyle = '#CD853F';
    ctx.fillRect(0, dinoGame.ground.y - 20, canvas.width, 20);
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, dinoGame.ground.y, canvas.width, canvas.height - dinoGame.ground.y);
    
    // Draw background objects (clouds, etc)
    ctx.fillStyle = '#FFFFFF';
    for (const obj of dinoGame.bgObjects) {
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw dino
    ctx.fillStyle = '#535353';
    if (dinoGame.dino.isDucking) {
        // Draw ducking dino (flatter and wider)
        ctx.fillRect(dinoGame.dino.x, dinoGame.dino.y, dinoGame.dino.width + 15, dinoGame.dino.height);
    } else {
        // Draw regular dino
        ctx.fillRect(dinoGame.dino.x, dinoGame.dino.y, dinoGame.dino.width, dinoGame.dino.height);
        
        // Draw head detail
        ctx.fillRect(dinoGame.dino.x + dinoGame.dino.width - 10, dinoGame.dino.y - 20, 30, 25);
        
        // Draw eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(dinoGame.dino.x + dinoGame.dino.width + 10, dinoGame.dino.y - 10, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw legs
        ctx.fillStyle = '#535353';
        ctx.fillRect(dinoGame.dino.x + 15, dinoGame.dino.y + dinoGame.dino.height, 10, 20);
        ctx.fillRect(dinoGame.dino.x + 40, dinoGame.dino.y + dinoGame.dino.height, 10, 20);
    }
    
    // Draw obstacles
    for (const obstacle of dinoGame.obstacles) {
        if (obstacle.type === 'cactus') {
            ctx.fillStyle = '#006400';
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // Draw cactus details
            if (obstacle.width > 20) {
                ctx.fillRect(obstacle.x - 10, obstacle.y + obstacle.height / 3, 15, 10);
                ctx.fillRect(obstacle.x + obstacle.width - 5, obstacle.y + obstacle.height / 2, 15, 10);
            }
        } else if (obstacle.type === 'bird') {
            ctx.fillStyle = '#8B4513';
            
            // Bird body
            ctx.beginPath();
            ctx.ellipse(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, 
                         obstacle.width / 2, obstacle.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Wings (animated)
            const wingOffset = Math.sin(Date.now() / 100) * 10;
            ctx.beginPath();
            ctx.ellipse(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2 - wingOffset, 
                         obstacle.width / 2, obstacle.height / 4, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Draw Flappy Bird Game
function drawFlappyGame() {
    // Draw sky background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#70C5CE');
    gradient.addColorStop(1, '#BEEEFB');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 5; i++) {
        const x = (((Date.now() / 50) + i * 200) % (canvas.width + 200)) - 100;
        const y = 50 + i * 30;
        drawCloud(x, y, 60 + i * 10);
    }
    
    // Draw bird
    const bird = flappyGame.bird;
    const angle = bird.velocity * 0.1;
    
    // Bird body
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    ctx.rotate(angle);
    
    // Yellow bird body
    ctx.fillStyle = '#FFDE59';
    ctx.beginPath();
    ctx.ellipse(0, 0, bird.width / 2, bird.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Wing (animated)
    ctx.fillStyle = '#FF9933';
    ctx.beginPath();
    const wingOffset = Math.sin(Date.now() / 100) * 5;
    ctx.ellipse(-5, wingOffset, bird.width / 3, bird.height / 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(8, -5, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(10, -5, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Beak
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath();
    ctx.moveTo(bird.width / 2, 0);
    ctx.lineTo(bird.width / 2 + 10, -5);
    ctx.lineTo(bird.width / 2 + 10, 5);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
    
    // Draw pipes
    ctx.fillStyle = '#2ECC71';
    for (const pipe of flappyGame.pipes) {
        ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);
        
        // Pipe cap
        ctx.fillStyle = '#27AE60';
        ctx.fillRect(pipe.x - 5, pipe.y === 0 ? pipe.height - 20 : pipe.y, pipe.width + 10, 20);
        ctx.fillStyle = '#2ECC71';
    }
}

// Helper function to draw cloud
function drawCloud(x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size / 3, 0, Math.PI * 2);
    ctx.arc(x + size / 2, y - size / 4, size / 3, 0, Math.PI * 2);
    ctx.arc(x + size / 2, y + size / 4, size / 4, 0, Math.PI * 2);
    ctx.arc(x + size, y, size / 3, 0, Math.PI * 2);
    ctx.fill();
}

// Check collision between two objects
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// Emergency reset function
function emergencyReset() {
    console.log("Emergency reset triggered");
    score = 0;
    
    if (currentGame === 'dino') {
        resetDinoGame();
    } else {
        resetFlappyGame();
    }
    
    // Force-clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Reset animation frame
    cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Add keyboard shortcut for emergency reset
window.addEventListener('keydown', (e) => {
    // Press 'R' key for emergency reset
    if (e.key === 'r' || e.key === 'R') {
        emergencyReset();
    }
});

// Start the game on load
window.addEventListener('load', init);