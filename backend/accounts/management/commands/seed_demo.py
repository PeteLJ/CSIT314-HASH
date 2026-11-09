from django.core.management.base import BaseCommand
from django.db import transaction
from accounts.models import User, Company, PropertyType

class Command(BaseCommand):
    help = 'Create a repeatable demo designer, company and property-type catalog.'

    @transaction.atomic
    def handle(self, *args, **options):
        user, created = User.objects.get_or_create(username='demo_designer', defaults={'role':User.Role.INTERIOR_DESIGNER, 'company':'Demo Studio'})
        if user.role != User.Role.INTERIOR_DESIGNER:
            raise ValueError('Existing demo username belongs to a non-designer; no changes made.')
        if created:
            user.set_unusable_password(); user.save()
        Company.objects.get_or_create(designer=user, defaults={'name':user.company or 'Demo Studio'})
        for name in ['HDB', 'Condominium', 'Landed', 'Commercial']:
            PropertyType.objects.get_or_create(name=name)
        self.stdout.write(f'Demo ready. For local development only: DEBUG=True DEMO_DESIGNER_ID={user.pk}')
