from django.contrib import admin
from .models import InteriorDesignProject, InterestEvent, ProjectFlag


@admin.register(InteriorDesignProject)
class InteriorDesignProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'designer', 'style', 'room_type', 'status', 'created_at')
    list_filter = ('status', 'style', 'room_type')
    search_fields = ('title', 'designer__username')


@admin.register(InterestEvent)
class InterestEventAdmin(admin.ModelAdmin):
    list_display = ('project', 'event_type', 'customer', 'occurred_at')
    list_filter = ('event_type', 'occurred_at')


@admin.register(ProjectFlag)
class ProjectFlagAdmin(admin.ModelAdmin):
    list_display = (
        'project',
        'reason',
        'status',
        'reporter',
        'created_at',
        'reviewed_by',
    )
    list_filter = ('status', 'reason', 'created_at')
    search_fields = ('project__title', 'details', 'moderation_note')
