import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_provision_existing_designers'),
        ('projects', '0003_alter_interiordesignproject_status'),
    ]

    operations = [
        migrations.AlterField(
            model_name='interiordesignproject',
            name='status',
            field=models.CharField(
                choices=[
                    ('DRAFT', 'Draft'),
                    ('PUBLISHED', 'Published'),
                    ('UNPUBLISHED', 'Unpublished'),
                    ('ARCHIVED', 'Archived'),
                    ('REMOVED', 'Removed by moderation'),
                ],
                default='DRAFT',
                max_length=16,
            ),
        ),
        migrations.CreateModel(
            name='ProjectFlag',
            fields=[
                (
                    'id',
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name='ID',
                    ),
                ),
                (
                    'reason',
                    models.CharField(
                        choices=[
                            ('INAPPROPRIATE', 'Inappropriate content'),
                            ('MISLEADING', 'Misleading information'),
                            ('COPYRIGHT', 'Copyright concern'),
                            ('OTHER', 'Other'),
                        ],
                        max_length=24,
                    ),
                ),
                ('details', models.TextField(blank=True)),
                (
                    'status',
                    models.CharField(
                        choices=[
                            ('OPEN', 'Open'),
                            ('RESOLVED', 'Resolved - project removed'),
                            ('DISMISSED', 'Dismissed - project kept'),
                        ],
                        default='OPEN',
                        max_length=16,
                    ),
                ),
                ('moderation_note', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('resolved_at', models.DateTimeField(blank=True, null=True)),
                (
                    'project',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='flags',
                        to='projects.interiordesignproject',
                    ),
                ),
                (
                    'reporter',
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='submitted_project_flags',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    'reviewed_by',
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='reviewed_project_flags',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={'ordering': ['-created_at']},
        ),
    ]
