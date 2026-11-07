from django.contrib import admin
from .models import User, Company, PropertyType


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role', 'company', 'is_active', 'date_joined')
    list_filter = ('role', 'is_active')
    search_fields = ('username', 'email', 'company')


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'designer', 'budget_minimum', 'budget_maximum')
    filter_horizontal = ('supported_property_types',)


admin.site.register(PropertyType)