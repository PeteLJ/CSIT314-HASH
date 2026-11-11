"""Run the US-03 API tests against an isolated Django test database."""
from pathlib import Path
import subprocess
import sys


if __name__ == '__main__':
    backend = Path(__file__).resolve().parents[1] / 'backend'
    result = subprocess.run(
        [sys.executable, 'manage.py', 'test', 'projects.test_search_filters', '--verbosity', '2'],
        cwd=backend,
        stderr=subprocess.STDOUT,
    )
    sys.exit(result.returncode)
