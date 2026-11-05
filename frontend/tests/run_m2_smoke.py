"""Run React DOM interactions against an isolated real Django database/server."""
import os
from pathlib import Path
import re
import socket
import subprocess
import sys
import tempfile
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
with tempfile.TemporaryDirectory(prefix='m2-smoke-') as directory:
    temp = Path(directory)
    (temp / 'm2_smoke_settings.py').write_text(
        'from config.settings import *\n'
        f'DATABASES = {{"default": {{"ENGINE": "django.db.backends.sqlite3", "NAME": {str(temp / "db.sqlite3")!r}}}}}\n')
    env = dict(os.environ, DJANGO_SETTINGS_MODULE='m2_smoke_settings', DEBUG='True',
               PYTHONPATH=os.pathsep.join([directory, str(ROOT / 'backend')]))
    subprocess.run([sys.executable, 'manage.py', 'migrate', '--noinput'], cwd=ROOT / 'backend', env=env, check=True, stdout=subprocess.DEVNULL)
    seed = subprocess.check_output([sys.executable, 'manage.py', 'seed_m2_demo'], cwd=ROOT / 'backend', env=env, text=True)
    env['M2_DEMO_DESIGNER_ID'] = re.search(r'M2_DEMO_DESIGNER_ID=(\d+)', seed).group(1)
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        port = sock.getsockname()[1]
    env['M2_TEST_API'] = f'http://127.0.0.1:{port}'
    server = subprocess.Popen([sys.executable, 'manage.py', 'runserver', f'127.0.0.1:{port}', '--noreload'], cwd=ROOT / 'backend', env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(100):
            try:
                urllib.request.urlopen(env['M2_TEST_API'] + '/api/company/settings/', timeout=1)
                break
            except Exception:
                time.sleep(.1)
        else:
            raise RuntimeError('Django server did not start')
        subprocess.run(['node', '--import', 'tsx', 'tests/m2-smoke.tsx'], cwd=ROOT / 'frontend', env=env, check=True, timeout=60)
    finally:
        server.terminate()
        server.wait(timeout=10)
