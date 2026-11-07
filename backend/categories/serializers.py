from rest_framework import serializers
from .models import ProjectCategory


class ProjectCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectCategory
        fields = ('id', 'name', 'category_type', 'description', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')
