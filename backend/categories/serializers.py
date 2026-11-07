from rest_framework import serializers
from .models import ProjectCategory


class ProjectCategorySerializer(serializers.ModelSerializer):
    project_count = serializers.SerializerMethodField()

    class Meta:
        model = ProjectCategory
        fields = (
            'id',
            'name',
            'category_type',
            'description',
            'project_count',
            'created_at',
        )
        read_only_fields = ('project_count', 'created_at')

    def get_project_count(self, obj):
        return obj.projects.count()

    def validate_name(self, value):
        name = value.strip()

        if not name:
            raise serializers.ValidationError(
                'Category name cannot be empty.'
            )

        duplicate = ProjectCategory.objects.filter(
            name__iexact=name
        )

        if self.instance:
            duplicate = duplicate.exclude(pk=self.instance.pk)

        if duplicate.exists():
            raise serializers.ValidationError(
                'A category with this name already exists.'
            )

        return name
