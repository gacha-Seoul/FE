"""Copy the supplied market assets byte-for-byte. Never sample or re-encode."""
import shutil
import hashlib
from pathlib import Path

root = Path(__file__).resolve().parents[1]
source = root / "Covered Korean Traditional Market.spz"
target = root / "public/models/market"
target.mkdir(parents=True, exist_ok=True)
for original, name in (
    (source, "market.spz"),
    (root / "Covered Korean Traditional Market_collider.glb", "collider.glb"),
    (root / "Covered Korean Traditional Market_pano.png", "panorama.png"),
):
    destination = target / name
    shutil.copyfile(original, destination)
    if hashlib.sha256(original.read_bytes()).digest() != hashlib.sha256(destination.read_bytes()).digest():
        raise ValueError(f"Asset copy differs from original: {name}")
    print(f"Copied original {name}: {destination.stat().st_size:,} bytes; SHA-256 verified")
