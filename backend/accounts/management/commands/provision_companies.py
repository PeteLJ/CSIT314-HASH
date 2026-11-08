from django.core.management.base import BaseCommand
from django.db import transaction
from accounts.models import User, Company, PropertyType
import random


class Command(BaseCommand):
    help = 'Create missing company settings, property types, and assign random settings for designers.'

    @transaction.atomic
    def handle(self, *args, **options):
        # Create property types if none exist
        property_type_names = ['HDB', 'Condominium', 'Landed', 'Commercial', 'Bungalow']
        for name in property_type_names:
            PropertyType.objects.get_or_create(name=name)

        random.seed(42)  # reproducible

        all_types = list(PropertyType.objects.all())
        count = 0
        for user in User.objects.filter(role=User.Role.INTERIOR_DESIGNER).iterator():
            company_name = user.company.strip() if user.company.strip() else f'{user.username} Design Studio'
            company, created = Company.objects.get_or_create(
                designer=user, defaults={'name': company_name})
            if created:
                count += 1

            # Assign property types if not already set
            if company.supported_property_types.count() == 0 and all_types:
                num_types = random.randint(1, min(3, len(all_types)))
                selected_types = random.sample(all_types, num_types)
                company.supported_property_types.set(selected_types)

            # Assign budget range if not already set
            if company.budget_minimum is None:
                budget_min = random.choice([10000, 15000, 20000, 25000, 30000, 40000, 50000])
                budget_max = random.choice([50000, 75000, 100000, 125000, 150000, 200000])
                if budget_max < budget_min:
                    budget_min, budget_max = budget_max, budget_min
                company.budget_minimum = budget_min
                company.budget_maximum = budget_max
                company.save()

        self.stdout.write(f'Created {count} company settings records.')
        self.stdout.write(f'Property types: {PropertyType.objects.count()}')