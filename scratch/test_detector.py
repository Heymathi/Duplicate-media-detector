from detector import DuplicateDetector
import os

try:
    detector = DuplicateDetector(threshold=0.95)
    print("Detector initialized successfully.")
    # Test on the sample dataset
    path = r"c:\Users\MY DELL\Desktop\Project\SampleDataset"
    if os.path.exists(path):
        print(f"Scanning {path}...")
        groups = detector.find_duplicates(path)
        print(f"Found {len(groups)} duplicate groups.")
    else:
        print(f"Path {path} does not exist.")
except Exception as e:
    print(f"ERROR: {e}")
