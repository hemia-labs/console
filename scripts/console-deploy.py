"""Install a digest-pinned Console compose bundle; never run builds or migrations."""
import argparse
import fcntl
import ipaddress
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile


def validate_bundle(bundle, registry):
    if not re.fullmatch(r"[a-zA-Z0-9.-]+(?::[0-9]+)?", registry):
        raise ValueError("Invalid registry host")
    manifest = json.loads((bundle / "release.json").read_text())
    revision = manifest["revision"]
    if not re.fullmatch(r"[a-f0-9]{40}", revision):
        raise ValueError("Expected a complete commit SHA")
    compose = json.loads((bundle / "compose.json").read_text())
    if set(compose["services"]) != {"api", "web"}:
        raise ValueError("Expected only Console api and web")
    for service, config in compose["services"].items():
        pattern = re.escape(registry) + "/console/" + service + r"@sha256:[a-f0-9]{64}"
        if not re.fullmatch(pattern, config.get("image", "")) or "build" in config:
            raise ValueError("Expected a registry image pinned by digest")
    return manifest, compose


def deploy(root, bundle, registry):
    manifest, compose = validate_bundle(bundle, registry)
    root = root.resolve()
    root.mkdir(parents=True, exist_ok=True)
    with (root / ".deploy.lock").open("w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        shared = root / "shared"
        secret = shared / "production.env"
        if not secret.is_file() or secret.stat().st_mode & 0o077:
            raise ValueError("shared/production.env must exist with mode 600 or 400")
        if "REPLACE_ON_SERVER" in secret.read_text():
            raise ValueError("Replace example secrets before deploying")
        settings = json.loads((shared / "host.json").read_text())
        bind = str(ipaddress.ip_address(settings.get("bind_address", "127.0.0.1")))
        if settings["public_url"].rstrip("/") != manifest["public_url"]:
            raise ValueError("Build public URL differs from shared/host.json")
        for service, port in [("api", 3016), ("web", 5176)]:
            config = compose["services"][service]
            config["ports"] = [{"target": port, "published": str(port), "host_ip": bind, "protocol": "tcp"}]
        compose["services"]["api"]["env_file"] = [{"path": str(secret), "format": "raw"}]
        releases = root / "releases"
        releases.mkdir(exist_ok=True)
        # Each attempt has its own directory; previous working bundles are never overwritten.
        release = Path(tempfile.mkdtemp(prefix=manifest["revision"][:12] + "-", dir=releases))
        (release / "compose.json").write_text(json.dumps(compose))
        shutil.copy2(bundle / "release.json", release / "release.json")
        current = root / "current"
        previous = current.resolve() if current.is_symlink() else None
        environment = {**os.environ, "COMPOSE_PROJECT_NAME": "hemia-console"}

        def run(directory, *args):
            subprocess.run(["docker", "compose", "--env-file", "/dev/null", "-p", "hemia-console",
                            "-f", str(directory / "compose.json"), *args], env=environment, check=True)

        # Complete pulls and validation before replacing running containers.
        run(release, "config", "--quiet")
        run(release, "pull")
        try:
            run(release, "up", "-d", "--no-build", "--wait", "--wait-timeout", "120")
        except subprocess.CalledProcessError:
            if previous:
                print("Deployment failed; restoring previous images", flush=True)
                run(previous, "up", "-d", "--no-build", "--wait", "--wait-timeout", "120")
            raise
        next_link = root / ".current-next"
        next_link.unlink(missing_ok=True)
        next_link.symlink_to(release)
        next_link.replace(current)
        print("Console healthy at revision " + manifest["revision"])


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument("--bundle", type=Path, required=True)
    parser.add_argument("--registry", required=True)
    args = parser.parse_args()
    deploy(args.root, args.bundle, args.registry)
