# Duplicate Image and Video Detector (Machine Learning Based)

This project uses deep learning to detect duplicate or near-duplicate images and videos in a given directory.

Instead of relying on simple file hashes (like MD5) or basic perceptual hashes, this tool uses **ResNet50**, a powerful Convolutional Neural Network (CNN) pre-trained on the ImageNet dataset. By extracting deep feature embeddings, it can find visually similar media even if they have been resized, slightly compressed, or have minor modifications.

## How it Works (Machine Learning Concepts)

1. **Feature Extraction (Images)**: The script passes images through a pre-trained ResNet50 model. We remove the final classification layer to get a dense, fully-connected feature vector (an "embedding") that represents the visual semantics of the image.
2. **Feature Extraction (Videos)**: For videos, the script extracts 1 frame per second. It computes the CNN feature vector for each extracted frame and then computes the mean embedding for the whole video (Mean Pooling). 
3. **Similarity Calculation**: It compares the feature vectors of all pairs using **Cosine Similarity**. If the similarity between two files is greater than a specified threshold (default: 0.95), they are considered duplicates.
4. **Removal**: Optionally, the tool can automatically keep one instance and delete the redundant duplicates.

## Prerequisites

You need Python 3.8+ installed on your system.

Install the required dependencies:
```bash
pip install -r requirements.txt
```

## Usage

Run the scanner to find duplicates (dry-run):
```bash
python main.py -d "path/to/your/folder"
```

To automatically remove duplicates (keeping the first one in each group):
```bash
python main.py -d "path/to/your/folder" -r
```

### Arguments

- `-d`, `--directory`: The directory you want to scan for duplicates (recursive).
- `-t`, `--threshold`: The similarity threshold for duplicates. Default is `0.95`. Decrease it to find "looser" matches, or increase to `0.99` for strict near-exact visual matches.
- `-r`, `--remove`: If passed, the script will delete duplicate files (it always preserves the first instance found).
