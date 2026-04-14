# VisionAI | Intelligent Duplicate Media Detector

A premium, machine learning-powered application to detect and remove duplicate (or near-duplicate) images and videos using **ResNet50** feature extraction.

## ✨ Features

- **ML-Driven Detection**: Uses deep learning embeddings (CNN) instead of simple pixel matching. Finds images that were resized, compressed, or slightly modified.
- **Video Support**: Scans videos by frame sampling and temporal averaging (Mean Pooling).
- **Stunning UI**: Modern dark-mode interface with glassmorphism and real-time scanning feedback.
- **Smart Grouping**: Automatically identifies the "original" and flags redundant copies for deletion.
- **Configurable Confidence**: Adjust the AI threshold to find exact duplicates or loose visual matches.

## 🚀 Getting Started

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Generate Sample Data (Optional)
To test the detector immediately, run the sample generator:
```bash
python generate_dataset.py
```

### 3. Launch the Application
Start the Flask backend and UI:
```bash
python app.py
```
Visit **http://127.0.0.1:5000** in your browser.

## 🧠 Machine Learning Concepts

1. **Feature Extraction**: The system uses a pre-trained **ResNet50** network. We strip the classification head and use the 2048-dimensional "bottleneck" vector as a visual fingerprint.
2. **Cosine Similarity**: Comparing high-dimensional vectors. A similarity of 1.0 means the visual features are identical in the latent space.
3. **Video Frame Sampling**: For videos, we extract features at 1 FPS and average them to create a single "video embedding" representing the entire clip.

## 🖥️ UI Usage
1. Enter the full path of the folder you want to scan.
2. Adjust the **AI Confidence Threshold** (0.95 is recommended for high accuracy).
3. Click **Start Scan**.
4. Review the results. The system keeps one instance (marked with ✓) and flags the rest for removal (marked with ✕).
5. Click **Clean Selected Duplicates** to delete the redundant files.
