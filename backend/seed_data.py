import os
import django
import random
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from projects.models import InteriorDesignProject, InterestEvent
from categories.models import ProjectCategory

User = get_user_model()

# Categories (from project styles)
category_names = ['Modern', 'Scandinavian', 'Industrial', 'Minimalist', 'Classic', 'Contemporary']
for name in category_names:
    ProjectCategory.objects.get_or_create(name=name)

# Property types (for company settings)
from accounts.models import PropertyType
property_type_names = ['HDB', 'Condominium', 'Landed', 'Commercial', 'Bungalow']
for name in property_type_names:
    PropertyType.objects.get_or_create(name=name)

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

designer_names = [
    'Wei Ming', 'Sarah', 'Jun Hao', 'Emily', 'Ahmad',
    'Jessica', 'Michael', 'Priya', 'David', 'Aisyah',
    'Rachel', 'James', 'Mei Ling', 'Robert', 'Fatimah',
    'Kevin', 'Lisa', 'Daniel', 'Amanda', 'Ryan',
]
for name in designer_names:
    d = User.objects.create_user(
        username=name,
        password='testpass123',
        role=User.Role.INTERIOR_DESIGNER,
    )
    designers.append(d)

# Projects
styles = list(ProjectCategory.objects.values_list('name', flat=True))
room_types = [choice[0] for choice in InteriorDesignProject.RoomType.choices]
statuses = [InteriorDesignProject.Status.DRAFT, InteriorDesignProject.Status.PUBLISHED,
            InteriorDesignProject.Status.PUBLISHED, InteriorDesignProject.Status.PUBLISHED,
            InteriorDesignProject.Status.ARCHIVED]
projects = []
for i in range(100):
    room_type = random.choice(room_types)
    # Realistic cost ranges per room type
    cost_ranges = {
        'BATHROOM': (12000, 25000),
        'KITCHEN': (12000, 40000),
        'BEDROOM': (12000, 35000),
        'LIVING_ROOM': (15000, 50000),
        'WHOLE_UNIT': (30000, 150000),
    }
    lo, hi = cost_ranges[room_type]
    cost = random.randint(lo, hi)
    style = random.choice(styles)
    p = InteriorDesignProject.objects.create(
        designer=random.choice(designers),
        title=f'Interior Design {i}',
        description=f'A beautiful {style.lower()} design project.',
        style=style,
        room_type=room_type,
        budget_min=cost,
        budget_max=cost + random.randint(0, 5000),
        status=random.choice(statuses),
    )
    projects.append(p)

# View events - spread across the last 90 days (20-100 views per project for realism)
# Only published projects get view events (drafts have 0 views/shortlists)
now = timezone.now()
local_now = timezone.localtime(now)
published_projects = [p for p in projects if p.status != InteriorDesignProject.Status.DRAFT]
view_events = []
for p in published_projects:
    for _ in range(random.randint(20, 100)):
        days_ago = random.randint(0, 29)
        occurred = local_now - timedelta(days=days_ago, hours=random.randint(0, 23))
        view_events.append(InterestEvent(
            project=p,
            event_type=InterestEvent.EventType.VIEW,
            occurred_at=occurred,
        ))
InterestEvent.objects.bulk_create(view_events)

# Shortlist events - proportional to views (realistic: ~5-15% of views become shortlists)
# Only published projects get shortlist events
shortlist_events = []
for p in published_projects:
    view_count = InterestEvent.objects.filter(project=p, event_type=InterestEvent.EventType.VIEW).count()
    shortlist_count = max(0, int(view_count * random.uniform(0.05, 0.15)))
    shortlisting_customers = random.sample(customers, min(shortlist_count, len(customers)))
    for c in shortlisting_customers:
        occurred = local_now - timedelta(days=random.randint(0, 29), hours=random.randint(0, 23))
        shortlist_events.append(InterestEvent(
            project=p,
            customer=c,
            event_type=InterestEvent.EventType.SHORTLIST,
            occurred_at=occurred,
        ))
InterestEvent.objects.bulk_create(shortlist_events)

print('Test data created successfully.')
print(f'Users: {User.objects.count()}')
print(f'Projects: {InteriorDesignProject.objects.count()}')
print(f'View events: {InterestEvent.objects.filter(event_type=InterestEvent.EventType.VIEW).count()}')
print(f'Shortlist events: {InterestEvent.objects.filter(event_type=InterestEvent.EventType.SHORTLIST).count()}')
print(f'Categories: {ProjectCategory.objects.count()}')

