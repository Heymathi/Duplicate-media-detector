import os
import urllib.request
import shutil

dataset_dir = "SampleDataset"
os.makedirs(dataset_dir, exist_ok=True)

print(f"Adding Sample Videos to '{dataset_dir}'...\n")

video_url = "https://www.w3schools.com/html/mov_bbb.mp4"
original_path = os.path.join(dataset_dir, "original_video.mp4")

try:
    print("Downloading 'Big Buck Bunny' sample video (this might take a few seconds)...")
    req = urllib.request.Request(video_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response, open(original_path, 'wb') as out_file:
        out_file.write(response.read())
    print(" -> Successfully downloaded original_video.mp4")
except Exception as e:
    print(f"Failed to download video: {e}")
    exit(1)

# Adding Duplicate Action
dup_path = os.path.join(dataset_dir, "duplicate_copy_video.mp4")
shutil.copy(original_path, dup_path)
print(" -> Successfully created a duplicate copy (duplicate_copy_video.mp4)")

print("\nAwesome! Your SampleDataset now contains videos as well!")
