from decimal import Decimal

from rest_framework import serializers
from .models import InteriorDesignProject, InterestEvent, ProjectFlag


class InteriorDesignProjectSerializer(serializers.ModelSerializer):
    designer_name = serializers.CharField(source='designer.username', read_only=True)
    designer_company = serializers.SerializerMethodField()
    designer_property_types = serializers.SerializerMethodField()
    designer_budget_range = serializers.SerializerMethodField()

    def get_designer_company(self, obj):
        try:
            return obj.designer.company_settings.name
        except Exception:
            return obj.designer.company or 'N/A'

    class Meta:
        model = InteriorDesignProject
        fields = ('id', 'title', 'description', 'style', 'room_type',
                  'budget_min', 'budget_max', 'status', 'category',
                  'designer', 'designer_name', 'designer_company', 'designer_property_types',
                  'designer_budget_range', 'created_at', 'updated_at')
        read_only_fields = ('designer', 'status', 'created_at', 'updated_at')

    def get_designer_property_types(self, obj):
        try:
            company = obj.designer.company_settings
            return list(company.supported_property_types.values_list('name', flat=True))
        except Exception:
            return []

    def get_designer_budget_range(self, obj):
        try:
            company = obj.designer.company_settings
            if company.budget_minimum is not None and company.budget_maximum is not None:
                return {'minimum': str(company.budget_minimum), 'maximum': str(company.budget_maximum)}
        except Exception:
            pass
        return None

    def validate(self, attrs):
        budget_min = attrs.get(
            'budget_min',
            getattr(self.instance, 'budget_min', None)
        )
        budget_max = attrs.get(
            'budget_max',
            getattr(self.instance, 'budget_max', None)
        )

        errors = {}

        if budget_min is not None and budget_min < 0:
            errors['budget_min'] = 'Budget cannot be negative.'

        if budget_max is not None and budget_max < 0:
            errors['budget_max'] = 'Budget cannot be negative.'

        if (
            budget_min is not None
            and budget_max is not None
            and budget_max < budget_min
        ):
            errors['budget_max'] = (
                'Maximum budget must be greater than '
                'or equal to minimum budget.'
            )

        if errors:
            raise serializers.ValidationError(errors)

        return attrs


class ProjectFlagSerializer(serializers.ModelSerializer):
    project_title = serializers.CharField(
        source='project.title',
        read_only=True,
    )
    project_status = serializers.CharField(
        source='project.status',
        read_only=True,
    )
    designer_name = serializers.CharField(
        source='project.designer.username',
        read_only=True,
    )
    reporter_name = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ProjectFlag
        fields = (
            'id',
            'project',
            'project_title',
            'project_status',
            'designer_name',
            'reporter_name',
            'reason',
            'details',
            'status',
            'moderation_note',
            'reviewed_by_name',
            'created_at',
            'resolved_at',
        )
        read_only_fields = fields

    def get_reporter_name(self, obj):
        return obj.reporter.username if obj.reporter else 'Anonymous'

    def get_reviewed_by_name(self, obj):
        return obj.reviewed_by.username if obj.reviewed_by else None


class ProjectFlagCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectFlag
        fields = (
            'id',
            'project',
            'reason',
            'details',
            'status',
            'created_at',
        )
        read_only_fields = ('id', 'status', 'created_at')

    def validate_project(self, project):
        if project.status != InteriorDesignProject.Status.PUBLISHED:
            raise serializers.ValidationError(
                'Only published projects can be flagged.'
            )
        return project

    def validate(self, attrs):
        if (
            attrs.get('reason') == ProjectFlag.Reason.OTHER
            and not attrs.get('details', '').strip()
        ):
            raise serializers.ValidationError({
                'details': 'Please describe the reason for this report.'
            })
        return attrs


class ProjectFlagModerationSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=('REMOVE', 'DISMISS'))
    moderation_note = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=1000,
    )


# --- DTOs (Data Transfer Objects) ---

class SearchCriteriaDTO(serializers.Serializer):
    """Search and filter parameters."""
    search_query = serializers.CharField(required=False, allow_blank=True)
    style = serializers.CharField(required=False, allow_blank=True)
    room_type = serializers.CharField(required=False, allow_blank=True)
    budget_min = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=Decimal('0'), required=False,
    )
    budget_max = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=Decimal('0'), required=False,
    )

    def validate(self, attrs):
        minimum, maximum = attrs.get('budget_min'), attrs.get('budget_max')
        if minimum is not None and maximum is not None and maximum < minimum:
            raise serializers.ValidationError({
                'budget_max': 'Maximum budget must be greater than or equal to minimum budget.',
            })
        return attrs

    def get_filters(self):
        """Return non-empty filters."""
        return {k: v for k, v in self.validated_data.items() if v is not None and v != ''}


class ProjectSummaryDTO(serializers.Serializer):
    """Project summary for browse list."""
    project_id = serializers.IntegerField(source='id')
    title = serializers.CharField()
    style = serializers.CharField()
    budget = serializers.DecimalField(max_digits=10, decimal_places=2, source='budget_min')
    designer_name = serializers.CharField(source='designer.username')

    def get_details(self):
        return f"{self.validated_data.get('title')} - {self.validated_data.get('style')}"


class ProjectDetailDTO(serializers.Serializer):
    """Project detail view data."""
    project_id = serializers.IntegerField(source='id')
    title = serializers.CharField()
    description = serializers.CharField()
    budget = serializers.DecimalField(max_digits=10, decimal_places=2, source='budget_min')
    designer_name = serializers.CharField(source='designer.username')
    view_count = serializers.IntegerField()
    shortlist_count = serializers.IntegerField()

    def get_formatted_budget(self):
        return f"${self.validated_data.get('budget'):,.0f}"


class ProjectData(serializers.Serializer):
    """Project creation data."""
    title = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True)
    renovation_budget = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    category_ids = serializers.ListField(child=serializers.IntegerField(), required=False)
    image_urls = serializers.ListField(child=serializers.URLField(), required=False)


class InterestSummary(serializers.Serializer):
    """Interest analytics data."""
    project_id = serializers.IntegerField()
    period = serializers.CharField()
    view_count = serializers.IntegerField()
    shortlist_count = serializers.IntegerField()


class InterestEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterestEvent
        fields = ('id', 'project', 'customer', 'occurred_at', 'event_type')
        read_only_fields = ('occurred_at', 'customer')

    def validate(self, attrs):
        if attrs.get('event_type') == InterestEvent.EventType.SHORTLIST:
            request = self.context.get('request')
            if request:
                customer = request.user
                project = attrs.get('project')
                if InterestEvent.objects.filter(
                    project=project,
                    customer=customer,
                    event_type=InterestEvent.EventType.SHORTLIST,
                ).exists():
                    raise serializers.ValidationError('You have already shortlisted this project.')
        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        if request and validated_data.get('event_type') == InterestEvent.EventType.SHORTLIST:
            validated_data['customer'] = request.user
        return super().create(validated_data)
