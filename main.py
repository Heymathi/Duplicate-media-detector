import argparse
import os
from detector import DuplicateDetector

def main():
    parser = argparse.ArgumentParser(description="Duplicate Image and Video Detector (Machine Learning Based)")
    parser.add_argument("-d", "--directory", required=True, help="The directory you want to scan for duplicates (recursive).")
    parser.add_argument("-t", "--threshold", type=float, default=0.95, help="The similarity threshold for duplicates. Default is 0.95.")
    parser.add_argument("-r", "--remove", action="store_true", help="Delete duplicate files (keeps the first instance found).")

    args = parser.parse_args()

    if not os.path.isdir(args.directory):
        print(f"Error: Directory '{args.directory}' does not exist or is not a directory.")
        return

    print(f"Initializing detector with threshold {args.threshold}...")
    detector = DuplicateDetector(threshold=args.threshold)
    
    duplicate_groups = detector.find_duplicates(args.directory)

    if not duplicate_groups:
        print("\nNo duplicates found.")
        return

    print("\n--- Duplicate Groups Found ---")
    duplicated_files_to_remove = []
    
    for i, group in enumerate(duplicate_groups):
        print(f"\nGroup {i+1}:")
        # Keep the first file, remove the rest
        print(f"  [Keep] {group[0]}")
        for dup in group[1:]:
            print(f"  [Duplicate] {dup}")
            duplicated_files_to_remove.append(dup)

    import json
    results_export = []
    
    for i, group in enumerate(duplicate_groups):
        files_data = []
        files_data.append({"path": group[0], "name": os.path.basename(group[0]), "keep": True})
        for dup in group[1:]:
            files_data.append({"path": dup, "name": os.path.basename(dup), "keep": False})
        
        results_export.append({
            "id": i + 1,
            "similarity": f"> {int(args.threshold * 100)}%",
            "files": files_data
        })
        
    with open("scan_results.json", "w") as f:
        json.dump(results_export, f, indent=4)
    print("\n[+] Created 'scan_results.json' - you can now open the UI dashboard to view these visually!")

    if args.remove and duplicated_files_to_remove:
        print("\n--- Removing Duplicates ---")
        for filepath in duplicated_files_to_remove:
            try:
                os.remove(filepath)
                print(f"Deleted: {filepath}")
            except Exception as e:
                print(f"Failed to delete {filepath}: {e}")
        print("\nRemoval complete.")
    elif not args.remove and duplicated_files_to_remove:
        print("\nRun with -r or --remove to automatically delete these duplicates.")

if __name__ == "__main__":
    main()
