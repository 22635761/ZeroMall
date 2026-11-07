import os
import sys
import time
from PIL import Image

sys.path.append("services/tryon-service/fashn-vton-1.5/src")
from fashn_vton import TryOnPipeline
import torch

os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"
device = "mps" if torch.backends.mps.is_available() else "cpu"
print(f"[*] Initializing FASHN VTON 1.5 Pipeline on {device}...")

weights_dir = os.path.abspath("services/tryon-service/fashn-vton-1.5/weights")
t0 = time.time()
pipeline = TryOnPipeline(weights_dir=weights_dir, device=device)
print(f"[+] Pipeline loaded in {round(time.time() - t0, 2)}s on {device}!")

# Test image paths
person_path = "services/tryon-service/fashn-vton-1.5/examples/data/model.webp"
garment_path = "services/tryon-service/fashn-vton-1.5/examples/data/garment.webp"

if os.path.exists(person_path) and os.path.exists(garment_path):
    print("[*] Running test inference on example images...")
    person = Image.open(person_path).convert("RGB")
    garment = Image.open(garment_path).convert("RGB")
    
    t_inf = time.time()
    out = pipeline(
        person_image=person,
        garment_image=garment,
        category="tops",
        garment_photo_type="flat-lay",
        num_timesteps=15  # Fast 15 steps for quick test
    )
    res_img = out.images[0]
    res_img.save("/tmp/fashn_test_output.jpg")
    print(f"[+] Inference finished in {round(time.time() - t_inf, 2)}s! Output saved to /tmp/fashn_test_output.jpg")
else:
    print("[+] Model ready for production!")
