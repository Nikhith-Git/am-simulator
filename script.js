// Get all the input elements
const messageFreqInput = document.getElementById('messageFreq');
const messageAmpInput = document.getElementById('messageAmp');
const carrierFreqInput = document.getElementById('carrierFreq');
const carrierAmpInput = document.getElementById('carrierAmp');

// Get all the value display elements
const messageFreqValue = document.getElementById('messageFreqValue');
const messageAmpValue = document.getElementById('messageAmpValue');
const carrierFreqValue = document.getElementById('carrierFreqValue');
const carrierAmpValue = document.getElementById('carrierAmpValue');

// Get modulation info elements
const modulationIndexSpan = document.getElementById('modulationIndex');
const modulationTypeSpan = document.getElementById('modulationType');

// Initialize chart configurations
const chartConfig = {
    type: 'line',
    options: {
        responsive: true,
        animation: false,
        scales: {
            x: {
                type: 'linear',
                title: {
                    display: true,
                    text: 'Time (s)'
                }
            },
            y: {
                type: 'linear',
                title: {
                    display: true,
                    text: 'Amplitude'
                }
            }
        }
    }
};

// Create charts
const messageChart = new Chart(
    document.getElementById('messageSignal'),
    { ...chartConfig, data: { datasets: [] } }
);

const carrierChart = new Chart(
    document.getElementById('carrierSignal'),
    { ...chartConfig, data: { datasets: [] } }
);

const modulatedChart = new Chart(
    document.getElementById('modulatedSignal'),
    { ...chartConfig, data: { datasets: [] } }
);

const demodulatedChart = new Chart(
    document.getElementById('demodulatedSignal'),
    { ...chartConfig, data: { datasets: [] } }
);

// Generate time points
function generateTimePoints(duration, samplingRate) {
    const points = [];
    for (let t = 0; t < duration; t += 1/samplingRate) {
        points.push(t);
    }
    return points;
}

// Generate message signal
function generateMessageSignal(timePoints, frequency, amplitude) {
    return timePoints.map(t => amplitude * Math.sin(2 * Math.PI * frequency * t));
}

// Generate carrier signal
function generateCarrierSignal(timePoints, frequency, amplitude) {
    return timePoints.map(t => amplitude * Math.sin(2 * Math.PI * frequency * t));
}

// Generate modulated signal
function generateModulatedSignal(timePoints, messageSignal, carrierSignal) {
    return timePoints.map((t, i) => carrierSignal[i] * (1 + messageSignal[i]));
}

// Generate envelope
function generateEnvelope(timePoints, messageSignal) {
    const upperEnvelope = [];
    const lowerEnvelope = [];
    const carrierAmp = parseFloat(carrierAmpInput.value);
    
    for (let i = 0; i < timePoints.length; i++) {
        upperEnvelope.push(carrierAmp * (1 + messageSignal[i]));
        lowerEnvelope.push(-carrierAmp * (1 + messageSignal[i]));
    }
    
    return { upper: upperEnvelope, lower: lowerEnvelope };
}

// Generate demodulated signal
function generateDemodulatedSignal(timePoints, modulatedSignal) {
    const demodulated = [];
    const samplingRate = 1000;
    const carrierFreq = parseFloat(carrierFreqInput.value);
    const windowSize = Math.floor(samplingRate / (2 * carrierFreq));
    
    // Peak detection with moving window
    for (let i = 0; i < modulatedSignal.length; i++) {
        let peakValue = 0;
        
        // Find peak in the window
        for (let j = Math.max(0, i - windowSize); j < Math.min(modulatedSignal.length, i + windowSize); j++) {
            peakValue = Math.max(peakValue, Math.abs(modulatedSignal[j]));
        }
        
        // Convert peak to message value
        const carrierAmp = parseFloat(carrierAmpInput.value);
        demodulated.push((peakValue / carrierAmp) - 1);
    }
    
    return demodulated;
}

// Update modulation information
function updateModulationInfo() {
    const messageAmp = parseFloat(messageAmpInput.value);
    const carrierAmp = parseFloat(carrierAmpInput.value);
    
    const modulationIndex = messageAmp;
    modulationIndexSpan.textContent = modulationIndex.toFixed(2);
    
    if (modulationIndex > 1) {
        modulationTypeSpan.textContent = "Over-modulation";
    } else if (modulationIndex < 1) {
        modulationTypeSpan.textContent = "Under-modulation";
    } else {
        modulationTypeSpan.textContent = "Critical (100%) modulation";
    }
}

// Update all charts
function updateCharts() {
    const duration = 1; // 1 second
    const samplingRate = 1000; // 1000 Hz
    const timePoints = generateTimePoints(duration, samplingRate);
    
    // Generate signals
    const messageSignal = generateMessageSignal(
        timePoints,
        parseFloat(messageFreqInput.value),
        parseFloat(messageAmpInput.value)
    );
    
    const carrierSignal = generateCarrierSignal(
        timePoints,
        parseFloat(carrierFreqInput.value),
        parseFloat(carrierAmpInput.value)
    );
    
    const modulatedSignal = generateModulatedSignal(timePoints, messageSignal, carrierSignal);
    const envelope = generateEnvelope(timePoints, messageSignal);
    const demodulatedSignal = generateDemodulatedSignal(timePoints, modulatedSignal);
    
    // Update message signal chart
    messageChart.data = {
        labels: timePoints,
        datasets: [{
            label: 'Message Signal',
            data: messageSignal,
            borderColor: 'rgb(75, 192, 192)',
            borderWidth: 1,
            pointRadius: 0
        }]
    };
    
    // Update carrier signal chart
    carrierChart.data = {
        labels: timePoints,
        datasets: [{
            label: 'Carrier Signal',
            data: carrierSignal,
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 1,
            pointRadius: 0
        }]
    };
    
    // Update modulated signal chart
    modulatedChart.data = {
        labels: timePoints,
        datasets: [
            {
                label: 'Modulated Signal',
                data: modulatedSignal,
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 1,
                pointRadius: 0
            },
            {
                label: 'Upper Envelope',
                data: envelope.upper,
                borderColor: 'rgb(255, 0, 0)',
                borderWidth: 2,
                pointRadius: 0,
                borderDash: [5, 5],
                fill: false
            },
            {
                label: 'Lower Envelope',
                data: envelope.lower,
                borderColor: 'rgb(255, 0, 0)',
                borderWidth: 2,
                pointRadius: 0,
                borderDash: [5, 5],
                fill: false
            }
        ]
    };
    
    // Update demodulated signal chart
    demodulatedChart.data = {
        labels: timePoints,
        datasets: [{
            label: 'Demodulated Signal',
            data: demodulatedSignal,
            borderColor: 'rgb(153, 102, 255)',
            borderWidth: 2,
            pointRadius: 0
        }]
    };
    
    // Update all charts
    messageChart.update();
    carrierChart.update();
    modulatedChart.update();
    demodulatedChart.update();
    
    // Update modulation information
    updateModulationInfo();
}

// Add event listeners to all inputs
messageFreqInput.addEventListener('input', (e) => {
    messageFreqValue.textContent = `${e.target.value} Hz`;
    updateCharts();
});

messageAmpInput.addEventListener('input', (e) => {
    messageAmpValue.textContent = e.target.value;
    updateCharts();
});

carrierFreqInput.addEventListener('input', (e) => {
    carrierFreqValue.textContent = `${e.target.value} Hz`;
    updateCharts();
});

carrierAmpInput.addEventListener('input', (e) => {
    carrierAmpValue.textContent = e.target.value;
    updateCharts();
});

// Initial update
updateCharts(); 