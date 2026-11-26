"""Copy only the pinned dictionary assets into the static Pages publish folder."""
import hashlib
import io
import json
import re
import sys
import tarfile
from pathlib import Path
from urllib.request import urlopen


def stage(target):
    wanted = json.loads((target / "dictionaries.json").read_text())
    if len(wanted) != 12 or any(not re.fullmatch(r"[a-z_]+\.dat\.gz", name) for name in wanted):
        raise ValueError("Invalid dictionary manifest")
    with urlopen("https://registry.npmjs.org/kuromoji/-/kuromoji-0.1.2.tgz", timeout=60) as response:
        body = response.read(22_000_001)
    if len(body) > 22_000_000:
        raise ValueError("Unexpected dictionary package size")
    out = target / "dict"
    out.mkdir(exist_ok=True)
    with tarfile.open(fileobj=io.BytesIO(body), mode="r:gz") as archive:
        for name, expected in wanted.items():
            member = archive.getmember("package/dict/" + name)
            if not member.isfile() or member.size > 8_000_000:
                raise ValueError("Unexpected dictionary entry")
            data = archive.extractfile(member).read()
            if hashlib.sha256(data).hexdigest() != expected:
                raise ValueError("Dictionary checksum mismatch: " + name)
            (out / name).write_bytes(data)


if __name__ == "__main__":
    stage(Path(sys.argv[1]))
