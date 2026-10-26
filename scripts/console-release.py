"""Create and validate digest-pinned, checksummed Console release assets."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess

TAG = re.compile(r'console-v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\Z')
DEFAULT_REGISTRY = 'registry.tail41610c.ts.net'


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def validate(directory, expected_tag=None, registry_host=None):
    directory = Path(directory)
    registry = registry_host or os.environ.get('REGISTRY_HOST') or DEFAULT_REGISTRY
    manifest = json.loads((directory / 'release.json').read_text())
    if manifest.get('schema') != 1 or not TAG.fullmatch(manifest.get('tag', '')):
        raise ValueError('Invalid Console release tag/schema')
    if expected_tag and manifest['tag'] != expected_tag:
        raise ValueError('Release does not match requested tag')
    if not re.fullmatch(r'[a-f0-9]{40}', manifest.get('revision', '')):
        raise ValueError('Invalid release commit')
    if manifest.get('registry') != registry:
        raise ValueError('Unexpected release registry')
    if not re.fullmatch(r'https://[a-zA-Z0-9.-]+(?::[0-9]+)?', manifest.get('public_url', '')):
        raise ValueError('Expected the HTTPS Console origin')
    for name in ['compose.json', 'console-deploy.py']:
        if digest(directory / name) != manifest['files'][name]:
            raise ValueError('Release asset checksum mismatch: ' + name)
    compose = json.loads((directory / 'compose.json').read_text())
    if set(compose['services']) != {'api', 'web'} or set(manifest['images']) != {'api', 'web'}:
        raise ValueError('Expected Console api and web')
    for service, config in compose['services'].items():
        pinned = manifest['images'][service]
        if not re.fullmatch(re.escape(registry) + '/console/' + service + r'@sha256:[a-f0-9]{64}', pinned):
            raise ValueError('Expected registry image pinned by digest')
        if 'build' in config or config['image'] != pinned:
            raise ValueError('Compose differs from release images')
    return manifest


def create(tag, output, images):
    if not TAG.fullmatch(tag):
        raise ValueError('Expected console-vMAJOR.MINOR.PATCH')
    root = Path(__file__).resolve().parents[1]
    versions = [json.loads((root / 'apps' / service / 'package.json').read_text())['version'] for service in ['api', 'web']]
    if versions[0] != versions[1] or tag != 'console-v' + versions[0]:
        raise ValueError('Tag differs from the shared package version')
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    environment = {**os.environ, 'CONSOLE_API_ENV_FILE': '/dev/null'}
    compose = json.loads(subprocess.check_output(['docker', 'compose', '--env-file', '/dev/null', 'config', '--no-env-resolution', '--format', 'json'], cwd=root, env=environment, text=True))
    for service, config in compose['services'].items():
        config.pop('build', None)
        config['image'] = images[service]
    # The controller supplies the actual secret path and bind address on the host.
    compose['services']['api']['env_file'] = [{'path': '/dev/null', 'format': 'raw'}]
    (output / 'compose.json').write_text(json.dumps(compose, indent=2) + '\n')
    (output / 'console-deploy.py').write_bytes((root / 'scripts/console-deploy.py').read_bytes())
    manifest = {
        'schema': 1, 'tag': tag, 'registry': os.environ['REGISTRY_HOST'],
        'revision': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip(),
        'public_url': os.environ['CONSOLE_PUBLIC_URL'], 'images': images,
        'files': {name: digest(output / name) for name in ['compose.json', 'console-deploy.py']},
    }
    (output / 'release.json').write_text(json.dumps(manifest, indent=2) + '\n')
    validate(output, tag)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['validate'])
    parser.add_argument('tag')
    parser.add_argument('directory')
    args = parser.parse_args()
    validate(args.directory, args.tag)
