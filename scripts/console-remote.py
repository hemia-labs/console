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
    # Apply the non-secret authorization setting through the dedicated deploy user.
    # An unset CI variable preserves the existing host configuration.
    mode = os.environ.get('HEMIA_AUTHORIZATION_MODE', '')
    if mode:
        if mode not in ('roles', 'authenticated'):
            raise ValueError('Invalid HEMIA_AUTHORIZATION_MODE')
        configure_mode = r"""import os,re,shutil,sys,tempfile
from pathlib import Path
from datetime import datetime,timezone
p=Path(sys.argv[1])/'shared/production.env'
if not p.is_file() or p.stat().st_mode & 0o077:
    raise ValueError('Expected private production.env')
old=p.read_text()
new=re.sub(r'^HEMIA_AUTHORIZATION_MODE=.*\n?', '', old, flags=re.M).rstrip()+'\nHEMIA_AUTHORIZATION_MODE='+sys.argv[2]+'\n'
if old != new:
    backup=p.with_name('production.env.before-authmode-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ'))
    shutil.copy2(p,backup)
    fd,tmp=tempfile.mkstemp(prefix='.production.env.',dir=p.parent)
    try:
        os.fchmod(fd,p.stat().st_mode & 0o777)
        with os.fdopen(fd,'w') as f: f.write(new)
        os.replace(tmp,p)
    finally:
        if os.path.exists(tmp): os.unlink(tmp)
print('HEMIA_AUTHORIZATION_MODE='+sys.argv[2])
"""
        subprocess.run(ssh + [shlex.join(['python3', '-c', configure_mode, root, mode])], check=True)
    subprocess.run(ssh + [shlex.join(args)], check=True)
finally:
    subprocess.run(ssh + [shlex.join(['rm', '-rf', '--', remote])], check=False)
