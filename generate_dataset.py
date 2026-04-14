import os
from PIL import Image, ImageDraw

def create_sample_dataset(base_dir="SampleDataset"):
    os.makedirs(base_dir, exist_ok=True)
    
    # Create an original image
    img1 = Image.new('RGB', (800, 800), color=(73, 109, 137))
    d = ImageDraw.Draw(img1)
    d.text((100,100), "Original Image", fill=(255,255,0))
    img1.save(os.path.join(base_dir, "original_1.jpg"))
    
    # Create a duplicate (resized)
    img1_dup = img1.resize((400, 400))
    img1_dup.save(os.path.join(base_dir, "duplicate_1_resized.jpg"))
    
    # Create another duplicate (slightly changed color to test ML tolerance)
    img1_v2 = Image.new('RGB', (800, 800), color=(70, 105, 130))
    d2 = ImageDraw.Draw(img1_v2)
    d2.text((100,100), "Original Image", fill=(255,255,0))
    img1_v2.save(os.path.join(base_dir, "duplicate_1_v2.jpg"))
    
    # Create a second unique image
    img2 = Image.new('RGB', (800, 800), color=(150, 50, 50))
    img2.save(os.path.join(base_dir, "original_2.jpg"))

    print(f"Sample dataset created in {os.path.abspath(base_dir)}")

if __name__ == "__main__":
    create_sample_dataset()
