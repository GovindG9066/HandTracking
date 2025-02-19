const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const img = document.getElementById("image");

// Set canvas size to match the video
canvas.width = 640;
canvas.height = 480;

// Access the webcam
navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
    video.srcObject = stream;
});

// Initialize MediaPipe Hands
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});

hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
});

// Link camera feed to hands detection
const camera = new Camera(video, {
    onFrame: async () => {
        await hands.send({ image: video });
    },
    width: 640,
    height: 480,
});

camera.start();

// Initialize transformation values
let imgScale = 1;
let imgRotation = 0;
let smoothRotation = 0; // Store smoothed rotation

// Process hand tracking results
hands.onResults((results) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        results.multiHandLandmarks.forEach((landmarks) => {
            drawHandLandmarks(landmarks); // Draw hand points
            updateImageTransform(landmarks); // Zoom & Rotate Image
        });
    }
});

// Function to draw landmarks on canvas
function drawHandLandmarks(landmarks) {
    ctx.fillStyle = "red";
    landmarks.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x * canvas.width, point.y * canvas.height, 5, 0, 2 * Math.PI);
        ctx.fill();
    });
}

// Function to update image scale & rotation together
function updateImageTransform(landmarks) {
    let thumbTip = landmarks[4];  // Thumb tip
    let indexTip = landmarks[8];  // Index finger tip

    // Calculate Euclidean distance (for zoom)
    let distance = Math.sqrt(
        Math.pow(indexTip.x - thumbTip.x, 2) +
        Math.pow(indexTip.y - thumbTip.y, 2)
    );
    
    // Scale factor
    imgScale = 1 + distance * 3;

    // Calculate rotation angle (thumb to index)
    let angle = Math.atan2(indexTip.y - thumbTip.y, indexTip.x - thumbTip.x);
    let targetRotation = angle * (180 / Math.PI); // Convert to degrees

    // **Smooth Rotation using Lerp (Linear Interpolation)**
    smoothRotation = lerp(smoothRotation, targetRotation, 0.1);

    // Apply both transformations together
    img.style.transform = `translate(-50%, -50%) scale(${imgScale}) rotate(${smoothRotation}deg)`;
}

// **Linear Interpolation Function (Lerp)**
function lerp(start, end, factor) {
    return start + (end - start) * factor;
}
