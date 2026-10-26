from django.contrib import admin
from .models import InteriorDesignProject, InterestEvent


@admin.register(InteriorDesignProject)
class InteriorDesignProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'designer', 'style', 'room_type', 'status', 'created_at')
    list_filter = ('status', 'style', 'room_type')
    search_fields = ('title', 'designer__username')


@admin.register(InterestEvent)
class InterestEventAdmin(admin.ModelAdmin):
    list_display = ('project', 'event_type', 'customer', 'occurred_at')
    list_filter = ('event_type', 'occurred_at')