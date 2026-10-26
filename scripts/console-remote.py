"""Copy the checked bundle and deploy through SSH with a pinned host key."""
import os
from pathlib import Path
import re
import shlex
import subprocess
import sys

bundle = Path(sys.argv[1])
host = os.environ['DEPLOY_HOST']
user = os.environ['DEPLOY_USER']
root = os.environ['DEPLOY_PATH']
port = int(os.environ.get('DEPLOY_PORT') or '22')
if not re.fullmatch(r'[a-zA-Z0-9][a-zA-Z0-9.-]*', host) or not re.fullmatch(r'[a-z_][a-z0-9_-]*', user):
    raise ValueError('Invalid deployment host or dedicated Unix user')
if not re.fullmatch(r'/[a-zA-Z0-9/_-]+', root) or '..' in Path(root).parts or not 1 <= port <= 65535:
    raise ValueError('Invalid deployment root or port')
options = ['-i', os.environ['DEPLOY_KEY_FILE'], '-o', 'IdentitiesOnly=yes',
           '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes',
           '-o', 'UserKnownHostsFile=' + os.environ['DEPLOY_KNOWN_HOSTS_FILE'],
           '-o', 'ConnectTimeout=15', '-o', 'ServerAliveInterval=15', '-o', 'ServerAliveCountMax=4']
target = user + '@' + host
ssh = ['ssh', *options, '-p', str(port), target]
remote = subprocess.check_output(ssh + ['mktemp -d /tmp/console-release.XXXXXXXX'], text=True).strip()
if not re.fullmatch(r'/tmp/console-release\.[a-zA-Z0-9]+', remote):
    raise ValueError('Unexpected remote temporary directory')
try:
    files = [str(bundle / name) for name in ['release.json', 'compose.json']]
    files.append(str(bundle / 'console-deploy.py'))
    subprocess.run(['scp', *options, '-P', str(port), *files, target + ':' + remote + '/'], check=True)
    args = ['python3', remote + '/console-deploy.py', '--root', root, '--bundle', remote,
            '--registry', os.environ['REGISTRY_HOST']]
    subprocess.run(ssh + [shlex.join(args)], check=True)
finally:
    subprocess.run(ssh + [shlex.join(['rm', '-rf', '--', remote])], check=False)
