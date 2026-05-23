# 🎥 Live Stream Processing (ASR & Vision)(POC)

📢 **Public Release Note:** This project is an experimental trial that I am opening up to the public. It is shared "as-is" in the hope that it might spark inspiration, serve as a playground and helpful reference, or act as a building block for someone else working at the intersection of live streaming and browser-based AI. It was originally developed in June 2025 as a **POC - Proof of Concept**.

A **local-first** multi-modal AI application that performs real-time analysis of HLS (HTTP Live Streaming) video feeds. By leveraging **WebGPU** and **Transformers.js**, this tool orchestrates Automatic Speech Recognition (ASR) and Vision-Language Models (VLM) entirely within the browser for a private and low-latency experience.

## Features
*   **Real-time HLS Ingestion**: Seamless playback and processing of live streams via `Hls.js`.
*   **On-Device Inference**: Full AI pipeline execution via **WebGPU**, ensuring data privacy and zero server costs.
*   **Multi-Modal Intelligence**: Context-aware analysis where ASR transcriptions are injected into the Vision model's reasoning engine.
*   **Optimized Audio Pipeline**: Uses `AudioWorklet` for off-main-thread resampling and accumulation, preventing UI stuttering.
*   **Granular Controls**: 
    *   **ASR Chunking**: Adjustable intervals (2s to 5s) for transcription cadence.
    *   **VLM Max Tokens**: Controlled response length (50 to 200 tokens) for performance balancing.
*   **Deterministic Logic**: Implements greedy decoding and repetition penalties to minimize AI hallucinations.


## Technical Architecture

### 1. Media Ingestion & Decoding
*   **Video**: `Hls.js` manages the stream manifest and segment loading.
*   **Audio**: Captured via `MediaElementSource` and processed through a custom `AudioWorkletProcessor` to downsample audio to **16kHz Mono** (Whisper's native requirement) in a background thread.

### 2. The AI Pipeline (`Transformers.js`)
*   **Automatic Speech Recognition (ASR)**: Utilizes `Whisper-tiny.en` for high-speed transcription.
*   **Vision-Language Model (VLM)**: Utilizes `SmolVLM-500M` to generate descriptive summaries.
*   **Orchestration**: ASR text is paired with downscaled video frames (384px) to form a multi-modal prompt: 
    > *"Based on the video frame, and the audio transcript '[ASR TEXT]', describe what is currently happening..."*

### 3. Hardware Acceleration
The app targets the **WebGPU** backend, utilizing 4-bit (`q4`) and 16-bit (`fp16`) quantization to fit complex models into browser VRAM without sacrificing significant accuracy.

## AI Models Used
*   **Xenova/whisper-tiny.en**: Optimized English speech-to-text.
*   **HuggingFaceTB/SmolVLM-500M-Instruct**: Lightweight VLM for image/text reasoning.


## Setup and Running

### Prerequisites
*   **Browser**: Microsoft Edge or Google Chrome (Version 113+).
*   **Hardware**: A device with a GPU supporting WebGPU (e.g., Apple M-series, modern NVIDIA/AMD cards).

### Installation & Local Execution
Due to security policies regarding ES modules and `AudioWorklets`, you must serve the files via a local web server:

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/ozgur-eralp/Live-Stream-Processing-App.git
    cd Live-Stream-Processing-App
    ```
2.  **Start a local server**:
    ```bash
    python3 -m http.server 8000
    ```
3.  **Access the app**: Open `http://localhost:8000` in Edge or Chrome.

## Usage
1.  **Wait for Model Initialization**: The browser will download several hundred MBs of weights upon first load. Check the **Console** (F12) for progress.
2.  **Load Stream**: Enter a valid HLS URL (e.g., the default Kaltura stream) and click **Load Stream**.
3.  **Configure Parameters**: Select your preferred ASR chunk duration (e.g., 3s) and VLM max tokens.
4.  **Process**: Click **Start ASR & Vision**.

## Security & Privacy
*   **Content Security Policy (CSP)**: The application uses a strict CSP to ensure scripts and media are only loaded from trusted sources.
*   **On-Device Processing**: No camera frames, audio samples, or transcripts are transmitted to external servers. All data remains in volatile browser memory.
*   **No API Keys**: Leverages public model weights directly from the Hugging Face Hub.

## Credits & License
- Developed by Ozgur Eralp (All rights reserved 2025).
- **Inference**: Transformers.js
- **Stream Playback**: Hls.js