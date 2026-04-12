import os
import cv2
import torch
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
import numpy as np
from tqdm import tqdm
from scipy.spatial.distance import cosine

class DuplicateDetector:
    def __init__(self, threshold=0.95):
        self.threshold = threshold
        # Automatically use GPU if available for faster ML inference
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Load a pre-trained ResNet50 model
        weights = models.ResNet50_Weights.DEFAULT
        self.model = models.resnet50(weights=weights)
        
        # Remove the final classification layer to get purely visual feature embeddings
        # This will extract the output of the AdaptiveAvgPool2d layer (vector of size 2048)
        self.model = torch.nn.Sequential(*(list(self.model.children())[:-1]))
        self.model.eval()
        self.model.to(self.device)
        
        # Standard ImageNet pre-processing transformations
        self.preprocess = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
        
    def extract_image_features(self, image_path):
        """Passes an image through ResNet50 and returns its 1D feature vector."""
        try:
            image = Image.open(image_path).convert("RGB")
            input_tensor = self.preprocess(image)
            input_batch = input_tensor.unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                features = self.model(input_batch)
                # Squeeze the (1, 2048, 1, 1) tensor down to (2048,)
                features = features.squeeze().cpu().numpy()
            return features
        except Exception as e:
            print(f"\nError processing {image_path}: {e}")
            return None

    def extract_video_features(self, video_path, frames_per_second=1):
        """Extracts 1 frame per second from a video, gets CNN features for each, and averages them."""
        try:
            cap = cv2.VideoCapture(video_path)
            fps = cap.get(cv2.CAP_PROP_FPS)
            
            # Fallback if fps is unreadable
            if fps == 0 or np.isnan(fps):
                fps = 30
                
            frame_interval = int(fps / frames_per_second)
            features_list = []
            frame_count = 0
            
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                    
                # Process exactly 1 frame per second
                if frame_count % frame_interval == 0:
                    # Convert BGR (OpenCV format) to RGB (Model format)
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    pil_img = Image.fromarray(frame_rgb)
                    
                    input_tensor = self.preprocess(pil_img)
                    input_batch = input_tensor.unsqueeze(0).to(self.device)
                    
                    with torch.no_grad():
                        feat = self.model(input_batch).squeeze().cpu().numpy()
                        features_list.append(feat)
                frame_count += 1
                
            cap.release()
            
            if not features_list:
                return None
                
            # Mean pooling across all extracted frames to get a single vector representing the video
            video_feature = np.mean(features_list, axis=0)
            return video_feature
            
        except Exception as e:
            print(f"\nError processing video {video_path}: {e}")
            return None

    def find_duplicates(self, directory):
        """Scans directory, computes embeddings, and groups duplicates using cosine similarity."""
        SUPPORTED_IMAGES = {'.png', '.jpg', '.jpeg', '.bmp', '.webp'}
        SUPPORTED_VIDEOS = {'.mp4', '.avi', '.mkv', '.mov'}
        
        files = []
        for root, _, filenames in os.walk(directory):
            for filename in filenames:
                ext = os.path.splitext(filename)[1].lower()
                if ext in SUPPORTED_IMAGES or ext in SUPPORTED_VIDEOS:
                    files.append(os.path.join(root, filename))
                
        features_dict = {}
        
        print(f"Extracting Machine Learning embeddings for {len(files)} files...")
        for filepath in tqdm(files, desc="Processing Files"):
            ext = os.path.splitext(filepath)[1].lower()
            if ext in SUPPORTED_IMAGES:
                feat = self.extract_image_features(filepath)
                if feat is not None:
                    features_dict[filepath] = feat
            elif ext in SUPPORTED_VIDEOS:
                feat = self.extract_video_features(filepath)
                if feat is not None:
                    features_dict[filepath] = feat
                    
        duplicate_groups = []
        processed = set()
        file_paths = list(features_dict.keys())
        
        print("\nCalculating cosine similarity to find duplicates...")
        for i, f1 in enumerate(tqdm(file_paths, desc="Comparing")):
            if f1 in processed:
                continue
                
            current_group = [f1]
            feat1 = features_dict[f1]
            
            for j in range(i + 1, len(file_paths)):
                f2 = file_paths[j]
                if f2 in processed:
                    continue
                    
                feat2 = features_dict[f2]
                
                # Calculate cosine similarity (1 - cosine distance)
                # Value ranges from -1 to 1. A value of 1 means exactly the same.
                sim = 1 - cosine(feat1, feat2)
                
                if sim >= self.threshold:
                    current_group.append(f2)
                    processed.add(f2)
                    
            if len(current_group) > 1:
                duplicate_groups.append(current_group)
            processed.add(f1)
            
        return duplicate_groups
