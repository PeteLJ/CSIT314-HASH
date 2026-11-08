from django.contrib import admin
from .models import ProjectCategory


@admin.register(ProjectCategory)
class ProjectCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'category_type', 'created_at', 'updated_at')
    search_fields = ('name',)