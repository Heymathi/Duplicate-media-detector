import sys
try:
    import flask
    print("flask: OK")
    import flask_cors
    print("flask_cors: OK")
    import torch
    print("torch: OK")
    import torchvision
    print("torchvision: OK")
    import cv2
    print("opencv: OK")
    import PIL
    print("pillow: OK")
    import numpy
    print("numpy: OK")
    import scipy
    print("scipy: OK")
    import tqdm
    print("tqdm: OK")
    
    from detector import DuplicateDetector
    print("detector: OK")
    detector = DuplicateDetector()
    print("Detector Init: OK")

except ImportError as e:
    print(f"MISSING LIBRARY: {e}")
except Exception as e:
    print(f"INITIALIZATION ERROR: {e}")
