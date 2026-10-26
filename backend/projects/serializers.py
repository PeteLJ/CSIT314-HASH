from rest_framework import serializers
from .models import InteriorDesignProject, InterestEvent


# Serializer for InteriorDesignProject model\nclass InteriorDesignProjectSerializer(serializers.ModelSerializer):
    designer_name = serializers.CharField(source='designer.username', read_only=True)

    class Meta:
        model = InteriorDesignProject
        fields = ('id', 'title', 'description', 'style', 'room_type',
                  'budget_min', 'budget_max', 'status', 'designer',
                  'designer_name', 'created_at', 'updated_at')
        read_only_fields = ('designer', 'created_at', 'updated_at')


# Serializer for InterestEvent model\nclass InterestEventSerializer(serializers.ModelSerializer):
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
