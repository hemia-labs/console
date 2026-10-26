import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('console_deploy', Path(__file__).resolve().parents[2] / 'scripts/console-deploy.py')
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)


class DeployTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'host'
        self.bundle = Path(self.temp.name) / 'bundle'
        self.bundle.mkdir()
        shared = self.root / 'shared'
        shared.mkdir(parents=True)
        self.secret = shared / 'production.env'
        self.secret.write_text('SSO_CLIENT_SECRET=fixture\n')
        self.secret.chmod(0o600)
        (shared / 'host.json').write_text(json.dumps({'public_url': 'https://console.example', 'bind_address': '127.0.0.1'}))
        self.manifest = {'revision': 'a' * 40, 'public_url': 'https://console.example'}
        self.compose = {'services': {name: {'image': 'registry.example/console/' + name + '@sha256:' + 'b' * 64} for name in ['api', 'web']}}
        self.save()

    def save(self):
        (self.bundle / 'release.json').write_text(json.dumps(self.manifest))
        (self.bundle / 'compose.json').write_text(json.dumps(self.compose))

    def test_rejects_mutable_or_foreign_images(self):
        for image in ['registry.example/console/api:latest', 'foreign.example/console/api@sha256:' + 'b' * 64]:
            self.compose['services']['api']['image'] = image
            self.save()
            with self.assertRaises(ValueError):
                deploy.validate_bundle(self.bundle, 'registry.example')

    @patch.object(deploy.subprocess, 'run')
    def test_installs_only_digest_images_and_keeps_secrets_on_host(self, run):
        deploy.deploy(self.root, self.bundle, 'registry.example')
        active = json.loads((self.root / 'current/compose.json').read_text())
        self.assertEqual(active['services']['api']['env_file'][0]['path'], str(self.secret.resolve()))
        commands = [call.args[0] for call in run.call_args_list]
        self.assertEqual(len(commands), 3)
        self.assertIn('pull', commands[1])
        self.assertIn('--wait', commands[2])
        self.assertNotIn('build', commands[2])

    @patch.object(deploy.subprocess, 'run')
    def test_failed_health_restores_previous_compose(self, run):
        previous = self.root / 'releases/previous'
        previous.mkdir(parents=True)
        (previous / 'compose.json').write_text(json.dumps(self.compose))
        (self.root / 'current').symlink_to(previous)
        run.side_effect = [None, None, subprocess.CalledProcessError(1, 'docker'), None]
        with self.assertRaises(subprocess.CalledProcessError):
            deploy.deploy(self.root, self.bundle, 'registry.example')
        self.assertEqual((self.root / 'current').resolve(), previous.resolve())
        self.assertIn(str(previous.resolve() / 'compose.json'), run.call_args.args[0])

    @patch.object(deploy.subprocess, 'run')
    def test_rejects_public_secrets_and_wrong_origin_before_docker(self, run):
        self.secret.chmod(0o644)
        with self.assertRaises(ValueError):
            deploy.deploy(self.root, self.bundle, 'registry.example')
        self.secret.chmod(0o600)
        self.manifest['public_url'] = 'https://wrong.example'
        self.save()
        with self.assertRaises(ValueError):
            deploy.deploy(self.root, self.bundle, 'registry.example')
        run.assert_not_called()
