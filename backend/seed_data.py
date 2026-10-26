import os
import django
import random
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from projects.models import InteriorDesignProject, InterestEvent
from categories.models import Category

User = get_user_model()

# Categories
categories = ['Modern', 'Scandinavian', 'Industrial', 'Minimalist', 'Classic', 'Contemporary']
for name in categories:
    Category.objects.get_or_create(name=name)

# Users
customers = []
designers = []
for i in range(100):
    c = User.objects.create_user(
        username=f'customer{i}',
        password='testpass123',
        role=User.Role.CUSTOMER,
    )
    customers.append(c)

for i in range(20):
    d = User.objects.create_user(
        username=f'designer{i}',
        password='testpass123',
        role=User.Role.INTERIOR_DESIGNER,
    )
    designers.append(d)

# Projects
styles = ['Modern', 'Scandinavian', 'Industrial', 'Minimalist', 'Classic', 'Contemporary']
room_types = ['LIVING_ROOM', 'BEDROOM', 'KITCHEN', 'BATHROOM', 'WHOLE_UNIT']
statuses = [InteriorDesignProject.Status.DRAFT, InteriorDesignProject.Status.PUBLISHED,
            InteriorDesignProject.Status.PUBLISHED, InteriorDesignProject.Status.PUBLISHED,
            InteriorDesignProject.Status.ARCHIVED]
projects = []
for i in range(100):
    p = InteriorDesignProject.objects.create(
        designer=random.choice(designers),
        title=f'Design Project {i}',
        description=f'A beautiful {random.choice(styles).lower()} design project.',
        style=random.choice(styles),
        room_type=random.choice(room_types),
        budget_min=random.choice([5000, 10000, 15000, 20000]),
        budget_max=random.choice([30000, 40000, 50000, 60000]),
        status=random.choice(statuses),
    )
    projects.append(p)

# View events - spread across the last 90 days
now = timezone.now()
for p in projects:
    for _ in range(random.randint(5, 30)):
        days_ago = random.randint(0, 89)
        InterestEvent.objects.create(
            project=p,
            event_type=InterestEvent.EventType.VIEW,
            occurred_at=now - timedelta(days=days_ago, hours=random.randint(0, 23)),
        )

# Shortlist events - spread across the last 90 days
for c in customers:
    for _ in range(random.randint(0, 10)):
        p = random.choice(projects)
        try:
            InterestEvent.objects.create(
                project=p,
                customer=c,
                event_type=InterestEvent.EventType.SHORTLIST,
                occurred_at=now - timedelta(days=random.randint(0, 89)),
            )
        except Exception:
            pass

print('Test data created successfully.')
print(f'Users: {User.objects.count()}')
print(f'Projects: {InteriorDesignProject.objects.count()}')
print(f'View events: {InterestEvent.objects.filter(event_type=InterestEvent.EventType.VIEW).count()}')
print(f'Shortlist events: {InterestEvent.objects.filter(event_type=InterestEvent.EventType.SHORTLIST).count()}')
print(f'Categories: {Category.objects.count()}')