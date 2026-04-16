import os
import urllib.request

models_dir = os.path.join("frontend", "public", "models")
os.makedirs(models_dir, exist_ok=True)

base_url = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/"

files = [
    "ssd_mobilenetv1_model-weights_manifest.json",
    "ssd_mobilenetv1_model-shard1",
    "ssd_mobilenetv1_model-shard2",
    "face_landmark_68_model-weights_manifest.json",
    "face_landmark_68_model-shard1",
    "face_recognition_model-weights_manifest.json",
    "face_recognition_model-shard1",
    "face_recognition_model-shard2",
]

for file_name in files:
    url = base_url + file_name
    dest = os.path.join(models_dir, file_name)
    if not os.path.exists(dest):
        print(f"Downloading {file_name}...")
        try:
            urllib.request.urlretrieve(url, dest)
        except Exception as e:
            print(f"Failed to download {file_name}: {e}")

print("Done downloading models.")
