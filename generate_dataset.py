import os
import urllib.request
from PIL import Image, ImageEnhance, ImageFilter
import shutil

dataset_dir = "SampleDataset"
os.makedirs(dataset_dir, exist_ok=True)

print(f"Creating Sample Machine Learning Dataset in '{dataset_dir}'...\n")

# 5 High Quality Unsplash Images (mostly cats to keep it consistent!)
urls = [
    "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=500&q=80",
    "https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=500&q=80",
    "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=500&q=80",
    "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&q=80",
    "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=500&q=80"
]

original_paths = []

for i, url in enumerate(urls):
    filepath = os.path.join(dataset_dir, f"image_original_{i}.jpg")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response, open(filepath, 'wb') as out_file:
            out_file.write(response.read())
        original_paths.append(filepath)
    except Exception as e:
        print(f"Skipping image {i} due to download error...")

print(f"Downloaded {len(original_paths)} original images.\n")
print("Now generating 'Near Duplicates' to test the ResNet50 AI...")

# Duplicate 1: Exact Copy
if original_paths:
    dup_path = os.path.join(dataset_dir, "image_exact_copy_0.jpg")
    shutil.copy(original_paths[0], dup_path)
    print(" -> Created exact copy of Image 0")

# Duplicate 2: Resampled, cropped, and color altered (A human can tell it's the same, let's see if the AI can)
if len(original_paths) > 1:
    img = Image.open(original_paths[1])
    width, height = img.size
    img_cropped = img.crop((20, 20, width-20, height-20)) # Zoom in slightly
    img_colored = ImageEnhance.Color(img_cropped).enhance(1.4) # Make colors pop more
    
    dup_path = os.path.join(dataset_dir, "image_near_duplicate_1.jpg")
    img_colored.save(dup_path, quality=50) # Compress heavily
    print(" -> Created 'near-duplicate' of Image 1 (Zoomed, Color-Boosted, Compressed)")

# Duplicate 3: Blurred and Grayscale
if len(original_paths) > 2:
    img = Image.open(original_paths[2])
    img_blurred = img.filter(ImageFilter.GaussianBlur(1.2)) # Slight blur
    img_gray = img_blurred.convert("L").convert("RGB") # Turn Black and White
    
    dup_path = os.path.join(dataset_dir, "image_near_duplicate_2.jpg")
    img_gray.save(dup_path)
    print(" -> Created 'near-duplicate' of Image 2 (Black & White, Blurred)")

print(f"\nAwesome! Your test dataset is completely ready in the '{dataset_dir}' folder.")
