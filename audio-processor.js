// audio-processor.js

/**
 * AudioWorkletProcessor for resampling and accumulating audio data.
 * This runs in a separate thread, preventing UI blocking and audio glitches.
 */
class AudioResamplerProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.audioBuffer = []; // Accumulates audio samples
        this.targetSampleRate = 16000; // Whisper model's expected sample rate

        // Listen for messages from the main thread (e.g., to update targetSampleRate)
        this.port.onmessage = (event) => {
            if (event.data.type === 'setTargetSampleRate') {
                this.targetSampleRate = event.data.sampleRate;
            }
        };
    }

    /**
     * Processes incoming audio.
     * @param {Float32Array[][]} inputs - An array of audio input buffers.
     * @param {Float32Array[][]} outputs - An array of audio output buffers (not used here).
     * @param {object} parameters - An object containing custom parameters (not used here).
     * @returns {boolean} - True to keep the processor alive, false to stop.
     */
    process(inputs, outputs, parameters) {
        const input = inputs[0]; // Get the first input (mono)
        if (input.length === 0) {
            return true; // No input, continue processing
        }

        const inputChannelData = input[0]; // Get the first channel's data
        const currentSampleRate = sampleRate; // Global sampleRate in AudioWorklet

        // Resample audio to the target sample rate (e.g., 16kHz for Whisper)
        const resampled = this.resampleAudio(inputChannelData, currentSampleRate, this.targetSampleRate);

        // Transfer the data to the main thread to minimize GC pressure
        if (resampled.length > 0) {
            // Transfer the underlying ArrayBuffer to the main thread (zero-copy)
            this.port.postMessage({ type: 'audioData', data: resampled }, [resampled.buffer]);
        }

        return true; // Keep the processor active
    }

    // Linear interpolation resampling function (copied from index.html)
    resampleAudio(audioBuffer, originalSampleRate, targetSampleRate) {
        if (originalSampleRate === targetSampleRate) return audioBuffer;
        const ratio = targetSampleRate / originalSampleRate;
        const newLength = Math.round(audioBuffer.length * ratio);
        const result = new Float32Array(newLength);
        const inverseRatio = 1 / ratio;
        for (let i = 0; i < newLength; i++) {
            const index = i * inverseRatio;
            const floor = Math.floor(index);
            const ceil = Math.ceil(index);
            const frac = index - floor;
            const val1 = audioBuffer[floor];
            const val2 = audioBuffer[Math.min(ceil, audioBuffer.length - 1)];
            result[i] = val1 * (1 - frac) + val2 * frac;
        }
        return result;
    }
}

registerProcessor('audio-resampler-processor', AudioResamplerProcessor);