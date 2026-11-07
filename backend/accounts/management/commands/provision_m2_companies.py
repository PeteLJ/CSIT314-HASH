from django.core.management.base import BaseCommand
from django.db import transaction
from accounts.models import User, Company
import random

COMPANY_NAMES = [
    'Studio Meridian', 'Haven Interiors', 'Urban Nest Design', 'Lumina Spaces',
    'Craft & Co Design', 'Aether Living', 'Prism Interior Studio', 'Nest & Noble',
    'Verve Design Co', 'Aura Living Spaces', 'Forma Interiors', 'Habitat Collective',
    'Maison Design Studio', 'Blueprint Interiors', 'Canvas & Oak', 'Echo Living',
    'Pivot Design Group', 'Solace Interiors', 'Terrain Studio', 'Vertex Living',
]


class Command(BaseCommand):
    help = 'Create missing company settings for designers without overwriting existing data.'

    @transaction.atomic
    def handle(self, *args, **options):
        designers = list(User.objects.filter(role=User.Role.INTERIOR_DESIGNER))
        random.seed(42)
        count = 0
        for i, user in enumerate(designers):
            company_name = COMPANY_NAMES[i % len(COMPANY_NAMES)]
            _, created = Company.objects.get_or_create(
                designer=user, defaults={'name': company_name})
            if created:
                count += 1
            else:
                # Update name if it was a fallback (username)
                if user.company.strip() == '' or user.company == user.username:
                    company = Company.objects.get(designer=user)
                    company.name = company_name
                    company.save()
                    user.company = company_name
                    user.save()
        self.stdout.write(f'Created/updated {count} company settings records.')