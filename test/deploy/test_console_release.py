import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('console_release', ROOT / 'scripts/console-release.py')
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)

class ReleaseTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.directory = Path(self.temp.name)
        self.compose = {'services': {s: {'image': release.DEFAULT_REGISTRY+'/console/'+s+'@sha256:'+'a'*64} for s in ['api','web']}}
        (self.directory/'compose.json').write_text(json.dumps(self.compose))
        (self.directory/'console-deploy.py').write_text('controller')
        self.manifest = {'schema':1,'tag':'console-v1.0.0','revision':'b'*40,'registry':release.DEFAULT_REGISTRY,'public_url':'https://console.hemia.cloud','images':{s:c['image'] for s,c in self.compose['services'].items()},'files':{name:release.digest(self.directory/name) for name in ['compose.json','console-deploy.py']}}
        self.save()

    def save(self):
        (self.directory/'release.json').write_text(json.dumps(self.manifest))

    def test_verifies_tag_commit_registry_and_both_assets(self):
        self.assertEqual(release.validate(self.directory,'console-v1.0.0')['revision'],'b'*40)
        with self.assertRaisesRegex(ValueError,'requested tag'):release.validate(self.directory,'console-v1.0.1')
        with self.assertRaisesRegex(ValueError,'registry'):release.validate(self.directory,registry_host='other.example')
        (self.directory/'console-deploy.py').write_text('tampered')
        with self.assertRaisesRegex(ValueError,'checksum'):release.validate(self.directory)

    def test_rejects_mutable_images_and_service_swaps(self):
        for value in ['registry.tail41610c.ts.net/console/api:latest',self.manifest['images']['web']]:
            self.manifest['images']['api']=value;self.save()
            with self.assertRaisesRegex(ValueError,'digest'):release.validate(self.directory)

    def test_create_uses_no_secret_file_and_matches_package_version(self):
        images={s:c['image'] for s,c in self.compose['services'].items()}
        def command(args,**kwargs):
            if args[0]=='docker':
                self.assertEqual(kwargs['env']['CONSOLE_API_ENV_FILE'],'/dev/null')
                return json.dumps({'services':{s:{'image':'local','build':{}} for s in ['api','web']}})
            return 'b'*40
        with patch.object(release.subprocess,'check_output',side_effect=command),patch.dict(os.environ,REGISTRY_HOST=release.DEFAULT_REGISTRY,CONSOLE_PUBLIC_URL='https://console.hemia.cloud'):
            release.create('console-v0.1.0',self.directory,images)
        compose=json.loads((self.directory/'compose.json').read_text())
        self.assertEqual(compose['services']['api']['env_file'][0]['path'],'/dev/null')
        self.assertNotIn('build',compose['services']['api'])
        with self.assertRaisesRegex(ValueError,'Tag differs'):release.create('console-v9.0.0',self.directory,images)
