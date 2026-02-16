let video, canvas, ctx;
let brightnessValues = [];
let timestamps = [];
let measuring = false;

function startMonitoring() {

    if (measuring) return;

    measuring = true;

    video = document.createElement("video");
    canvas = document.createElement("canvas");
    ctx = canvas.getContext("2d");

    navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
    }).then(stream => {

        video.srcObject = stream;
        video.play();

        canvas.width = 200;
        canvas.height = 200;

        brightnessValues = [];
        timestamps = [];

        let interval = setInterval(() => {

            ctx.drawImage(video, 0, 0, 200, 200);
            let frame = ctx.getImageData(0, 0, 200, 200);
            let brightness = calculateBrightness(frame.data);

            brightnessValues.push(brightness);
            timestamps.push(Date.now());

            if (brightnessValues.length >= 200) {

                clearInterval(interval);
                stream.getTracks().forEach(track => track.stop());

                calculateBPM();
                measuring = false;
            }

        }, 100);

    }).catch(err => {
        alert("Camera permission denied.");
        measuring = false;
    });
}

function calculateBrightness(data) {
    let total = 0;
    for (let i = 0; i < data.length; i += 4) {
        total += data[i]; // red channel
    }
    return total / (data.length / 4);
}

function calculateBPM() {

    let peaks = 0;
    let avg = brightnessValues.reduce((a,b)=>a+b) / brightnessValues.length;

    for (let i = 1; i < brightnessValues.length - 1; i++) {
        if (
            brightnessValues[i] > brightnessValues[i - 1] &&
            brightnessValues[i] > brightnessValues[i + 1] &&
            brightnessValues[i] > avg
        ) {
            peaks++;
        }
    }

    let duration = (timestamps[timestamps.length - 1] - timestamps[0]) / 1000;
    let bpm = Math.round((peaks / duration) * 60);

    if (bpm < 40 || bpm > 180) {
        document.getElementById("status").innerText = "Measurement unstable. Try again.";
        document.getElementById("bpm").innerText = "--";
        document.getElementById("frequency").innerText = "-- Hz";
        return;
    }

    let frequency = (bpm / 60).toFixed(2);

    document.getElementById("bpm").innerText = bpm;
    document.getElementById("frequency").innerText = frequency + " Hz";

    if (bpm < 60) {
        document.getElementById("status").innerText = "Bradycardia Detected";
    }
    else if (bpm > 120) {
        document.getElementById("status").innerText = "Tachycardia Detected";
    }
    else {
        document.getElementById("status").innerText = "Normal Heart Rate";
    }
}
