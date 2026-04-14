import os
import json
import shutil
import urllib.parse
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from detector import DuplicateDetector


app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app, resources={r"/api/*": {"origins": "*"}})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
    
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    return response

# Explicitly check for dependencies and print errors to terminal
def check_dependencies():
    missing = []
    try: import torch
    except: missing.append("torch")
    try: import torchvision
    except: missing.append("torchvision")
    try: import cv2
    except: missing.append("opencv-python")
    try: import scipy
    except: missing.append("scipy")
    
    if missing:
        print("\n" + "!"*50)
        print(f"CRITICAL ERROR: Missing libraries: {', '.join(missing)}")
        print("Please run: pip install -r requirements.txt")
        print("!"*50 + "\n")
        return False
    return True

if not check_dependencies():
    print("Startup aborted due to missing dependencies.")
    # We won't exit here so the user can at least see the console output
else:
    # Global detector instance
    print("Initializing Machine Learning model (ResNet50)...")
    detector = DuplicateDetector(threshold=0.95)
    print("Model loaded successfully.")

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/api/upload', methods=['POST', 'OPTIONS'])
def upload_files():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    if 'files' not in request.files:
        return jsonify({"error": "No files part"}), 400
    
    files = request.files.getlist('files')
    threshold = float(request.form.get('threshold', 0.95))
    
    # Create a temporary sandbox for this session
    import tempfile
    temp_dir = tempfile.mkdtemp(prefix="ai_scan_")
    
    saved_paths = []
    for file in files:
        if file.filename:
            filename = os.path.basename(file.filename)
            path = os.path.join(temp_dir, filename)
            file.save(path)
            saved_paths.append(path)
            
    print(f"Uploaded {len(saved_paths)} files to temporary sandbox: {temp_dir}")
    
    try:
        detector.threshold = threshold
        groups = detector.find_duplicates(temp_dir)
        
        results = []
        for group in groups:
            results.append({
                "original": group[0],
                "duplicates": group[1:],
                "size": len(group)
            })
        return jsonify({"results": results, "count": len(groups), "scanned_files": saved_paths})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/scan', methods=['POST', 'OPTIONS'])
def scan_directory():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    data = request.json
    directory = data.get('directory')
    threshold = float(data.get('threshold', 0.95))
    
    if not directory or not os.path.isdir(directory):
        return jsonify({"error": "Invalid directory path"}), 400
    
    print(f"Starting scan for: {directory} (Threshold: {threshold})")
    detector.threshold = threshold
    try:
        groups = detector.find_duplicates(directory)
        scanned_files = []
        SUPPORTED = {'.png', '.jpg', '.jpeg', '.bmp', '.webp', '.mp4', '.avi', '.mkv', '.mov'}
        for root, _, filenames in os.walk(directory):
            for filename in filenames:
                ext = os.path.splitext(filename)[1].lower()
                if ext in SUPPORTED:
                    scanned_files.append(os.path.join(root, filename))

        print(f"Scan complete. Found {len(groups)} groups.")
        # Format results for UI
        results = []
        for group in groups:
            results.append({
                "original": group[0],
                "duplicates": group[1:],
                "size": len(group)
            })
        return jsonify({"results": results, "count": len(groups), "scanned_files": scanned_files})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/delete', methods=['POST', 'OPTIONS'])
def delete_duplicates():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    data = request.json
    duplicates = data.get('files', [])
    
    deleted_count = 0
    errors = []
    
    for file_path in duplicates:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                deleted_count += 1
        except Exception as e:
            errors.append(f"Error deleting {file_path}: {str(e)}")
            
    return jsonify({
        "status": "success", 
        "deleted_count": deleted_count,
        "errors": errors
    })

@app.route('/media')
def serve_media():
    path = request.args.get('path', '')
    if not path:
        return jsonify({"error": "Missing media path"}), 400

    filename = urllib.parse.unquote(path)
    normalized = filename.replace('/', os.sep).replace('\\', os.sep)
    normalized = os.path.normpath(normalized)

    if os.path.isabs(normalized) and os.path.exists(normalized):
        return send_file(normalized, conditional=True)

    return jsonify({"error": "File not found"}), 404

if __name__ == '__main__':
    print("AI Duplicate Detector Backend Running at http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
