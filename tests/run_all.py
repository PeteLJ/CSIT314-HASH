"""Run all user story test scripts.

Run: python tests/run_all.py
"""
import subprocess
import sys
import os

scripts = [
    'test_us03_search_filter.py',
    'test_us12_property_types.py',
    'test_us21_create_project.py',
    'test_us35_view_details.py',
    'test_us48_portfolio_overview.py',
    'test_us49_trend_chart.py',
    'test_us51_categories.py',
]

print("=" * 70)
print("HASH Designs - User Story Test Scripts")
print("=" * 70)
print()

results = {}
for script in scripts:
    print(f"\nRunning {script}...")
    print("-" * 70)
    result = subprocess.run(
        [sys.executable, os.path.join(os.path.dirname(__file__), script)],
        capture_output=True,
        text=True,
        cwd=os.path.join(os.path.dirname(__file__), '..', 'backend')
    )
    print(result.stdout)
    if result.returncode != 0:
        print(f"ERROR: {result.stderr}")
        results[script] = 'FAILED'
    else:
        # Check for FAIL in output
        if '  FAIL' in result.stdout:
            results[script] = 'SOME TESTS FAILED'
        else:
            results[script] = 'PASSED'

print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)
for script, result in results.items():
    print(f"  {script}: {result}")

all_passed = all(r == 'PASSED' for r in results.values())
print()
if all_passed:
    print("All test scripts passed!")
else:
    print("Some tests failed. Check output above.")