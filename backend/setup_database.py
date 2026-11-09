"""
Complete database setup script for PythonAnywhere deployment.

This script does everything needed to set up a fresh database:
1. Runs migrations (via manage.py)
2. Seeds test data (100 projects, 120 users, 6 categories, 5 property types)
3. Provisions companies with property types and budget ranges
4. Fixes existing projects without categories
5. Creates admin user

Usage on PythonAnywhere:
    cd ~/CSIT314-HASH/backend
    python setup_database.py

Or run each step individually:
    python manage.py migrate
    python seed_data.py
    python manage.py provision_companies
    python manage.py shell < fix_categories.py
    python manage.py createsuperuser
"""
import os
import sys
import django
import subprocess

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from projects.models import InteriorDesignProject
from categories.models import ProjectCategory
from accounts.models import User, Company, PropertyType

User = get_user_model()

print("=" * 60)
print("HASH Designs - Database Setup")
print("=" * 60)

# Step 1: Check migrations
print("\n[Step 1] Checking migrations...")
from django.core.management import call_command
call_command('migrate')
print("  Migrations applied")

# Step 2: Check if data exists, seed if needed
print("\n[Step 2] Checking seed data...")
if User.objects.count() < 10:
    print("  Database is empty or incomplete. Running seed_data.py...")
    result = subprocess.run([sys.executable, 'seed_data.py'], capture_output=True, text=True)
    print(result.stdout)
    if result.returncode != 0:
        print(f"  ERROR: {result.stderr}")
else:
    print(f"  Found {User.objects.count()} users, {InteriorDesignProject.objects.count()} projects")
    print("  Skipping seed (data already exists)")

# Step 3: Provision companies
print("\n[Step 3] Provisioning companies...")
call_command('provision_companies')

# Step 4: Fix projects without categories
print("\n[Step 4] Fixing projects without categories...")
updated = 0
for p in InteriorDesignProject.objects.filter(category__isnull=True):
    cat = ProjectCategory.objects.filter(name__iexact=p.style).first()
    if cat:
        p.category = cat
        p.save()
        updated += 1
print(f"  Updated {updated} projects with categories")
for cat in ProjectCategory.objects.all():
    print(f"    {cat.name}: {cat.projects.count()} projects")

# Step 5: Check admin user
print("\n[Step 5] Checking admin user...")
if User.objects.filter(is_superuser=True).exists():
    admin = User.objects.filter(is_superuser=True).first()
    print(f"  Admin user exists: {admin.username}")
else:
    print("  No admin user found. Create one with:")
    print("    python manage.py createsuperuser")
    print("  (Username: admin, Password: admin123)")

print("\n" + "=" * 60)
print("Database setup complete!")
print("=" * 60)
print("\nNext steps:")
print("  1. Go to Web tab and click Reload")
print("  2. Test https://petelj.pythonanywhere.com/api/projects/")
print("  3. Access admin at https://petelj.pythonanywhere.com/admin/")