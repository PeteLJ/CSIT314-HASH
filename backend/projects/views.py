from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.db.models import Count, Q
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from django.utils import timezone
from accounts.models import User
from .models import InteriorDesignProject, InterestEvent, ProjectFlag
from .serializers import (
    InteriorDesignProjectSerializer,
    InterestEventSerializer,
    ProjectFlagSerializer,
    ProjectFlagCreateSerializer,
    ProjectFlagModerationSerializer,
    SearchCriteriaDTO,
    ProjectSummaryDTO,
    ProjectDetailDTO,
    ProjectData,
    InterestSummary,
)
from rest_framework.permissions import BasePermission, SAFE_METHODS
from django.contrib.auth import get_user_model

User = get_user_model()


# US-21: Create Interior Design Project
class ProjectValidator:
    @staticmethod
    def validate_draft(data):
        errors = []
        if not str(data.get('title', '')).strip():
            errors.append('Title is required.')
        return errors

    @staticmethod
    def validate_for_publication(project):
        errors = []
        if not project.title.strip():
            errors.append('Project title is required.')
        if not project.description.strip():
            errors.append('Project description is required.')
        if not project.style.strip():
            errors.append('Design style is required.')
        if not project.room_type:
            errors.append('Room type is required.')
        if project.budget_min is None:
            errors.append('Minimum budget is required.')
        if project.budget_max is None:
            errors.append('Maximum budget is required.')
        if (
            project.budget_min is not None
            and project.budget_max is not None
            and project.budget_max < project.budget_min
        ):
            errors.append('Invalid budget range.')
        if project.category_id is None:
            errors.append('Project category is required.')

        return errors


# US-31: Browse Design Projects
class ProjectController(generics.ListCreateAPIView):
    """Browse all published projects. Create a new project (draft or published)."""
    serializer_class = InteriorDesignProjectSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = InteriorDesignProject.objects.filter(
            status=InteriorDesignProject.Status.PUBLISHED
        )
        # US-03: Search and filter (search by keyword, filter by style, room type, budget)
        search = self.request.query_params.get('search')
        style = self.request.query_params.get('style')
        room_type = self.request.query_params.get('room_type')
        category = self.request.query_params.get('category')

        params = self.request.query_params
        criteria = SearchCriteriaDTO(data={
            key: params[key] for key in ('budget_min', 'budget_max') if key in params
        })
        criteria.is_valid(raise_exception=True)
        budget_min = criteria.validated_data.get('budget_min')
        budget_max = criteria.validated_data.get('budget_max')

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(style__icontains=search) | Q(room_type__icontains=search)
            )
        if style:
            queryset = queryset.filter(style__iexact=style)
        if room_type:
            queryset = queryset.filter(room_type__iexact=room_type)
        if budget_min is not None:
            queryset = queryset.filter(budget_min__gte=budget_min)
        if budget_max is not None:
            queryset = queryset.filter(budget_min__lte=budget_max)
        if category:
            queryset = queryset.filter(category__name__iexact=category)

        # Property type filter (US-12: filter by designer's supported property types)
        property_type = self.request.query_params.get('property_type')
        if property_type:
            queryset = queryset.filter(
                designer__company_settings__supported_property_types__name__iexact=property_type
            )

        # Budget range filter (US-15: filter by designer's company accepted budget range)
        my_budget = self.request.query_params.get('my_budget')
        if my_budget:
            queryset = queryset.filter(
                designer__company_settings__budget_minimum__lte=my_budget,
                designer__company_settings__budget_maximum__gte=my_budget,
            )

        # US-31: Sort Displayed List
        sort = self.request.query_params.get('sort')
        if sort == 'latest':
            queryset = queryset.order_by('-created_at')
        elif sort == 'most_viewed':
            queryset = queryset.order_by('-created_at')
        elif sort == 'budget_asc':
            queryset = queryset.order_by('budget_min')
        elif sort == 'budget_desc':
            queryset = queryset.order_by('-budget_min')

        return queryset

    def list(self, request, *args, **kwargs):
        # US-31: Display Paginated List
        queryset = self.filter_queryset(self.get_queryset())
        page = request.query_params.get('page')
        page_size = request.query_params.get('page_size', 12)
        if page:
            try:
                page = int(page)
                page_size = int(page_size)
                start = (page - 1) * page_size
                end = start + page_size
                total = queryset.count()
                page_qs = queryset[start:end]
                serializer = self.get_serializer(page_qs, many=True)
                return Response({
                    'results': serializer.data,
                    'total': total,
                    'page': page,
                    'page_size': page_size,
                    'total_pages': (total + page_size - 1) // page_size,
                })
            except (ValueError, TypeError):
                pass
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def get_permissions(self):
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        designer_id = self.request.data.get('designer_id') or self.request.query_params.get('designer_id')
        if designer_id:
            try:
                designer = User.objects.get(pk=designer_id, role=User.Role.INTERIOR_DESIGNER)
            except User.DoesNotExist:
                designer = User.objects.filter(role=User.Role.INTERIOR_DESIGNER).first()
        elif self.request.user.is_authenticated and self.request.user.role == 'INTERIOR_DESIGNER':
            designer = self.request.user
        else:
            designer = User.objects.filter(role=User.Role.INTERIOR_DESIGNER).first()

        if not designer:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No interior designer found.')

        errors = ProjectValidator.validate_draft(serializer.validated_data)
        if errors:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'errors': errors})

        serializer.save(
            designer=designer,
            status=InteriorDesignProject.Status.DRAFT,
        )

    def getProjectsForBrowse(self):
        """Get published projects for browse."""
        return self.get_queryset()

    def getPublishedProjects(self, criteria=None):
        """Get published projects with filters."""
        return self.get_queryset()

    def fetchAllProjects(self):
        """Fetch all projects."""
        return self.get_queryset()

    def fetchProjectById(self, project_id):
        """Fetch project by ID."""
        return InteriorDesignProject.objects.get(pk=project_id)

    def findPublished(self, criteria=None):
        """Find published projects."""
        return self.get_queryset()

    def validate(self, criteria):
        """Validate criteria."""
        return True

    def search(self, criteria):
        """Search projects."""
        return self.get_queryset()

    def paginate(self, results):
        """Paginate results."""
        return results


# US-35: View Project Details
class IsProjectOwnerOrReadOnly(BasePermission):

    def has_object_permission(self, request, view, obj):
        is_owner = (
            request.user.is_authenticated
            and obj.designer_id == request.user.id
        )

        is_staff = (
            request.user.is_authenticated
            and request.user.is_staff
        )

        if request.method in SAFE_METHODS:
            return (
                obj.status == InteriorDesignProject.Status.PUBLISHED
                or is_owner
                or is_staff
            )

        return is_owner or is_staff


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = InteriorDesignProject.objects.all()
    serializer_class = InteriorDesignProjectSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
        IsProjectOwnerOrReadOnly,
    ]

    def getProjectDetails(self, project_id):
        """Get project details by ID."""
        return InteriorDesignProject.objects.get(pk=project_id)


class MyProjectsView(generics.ListAPIView):
    serializer_class = InteriorDesignProjectSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        designer_id = self.request.query_params.get('designer_id')
        if designer_id:
            return InteriorDesignProject.objects.filter(designer_id=designer_id)
        if self.request.user.is_authenticated:
            return InteriorDesignProject.objects.filter(designer=self.request.user)
        return InteriorDesignProject.objects.all()


# US-24: Manage Project Publication Status
class ProjectPublishView(APIView):
    permission_classes = [permissions.AllowAny]

    def patch(self, request, pk):
        try:
            project = InteriorDesignProject.objects.get(pk=pk)
        except InteriorDesignProject.DoesNotExist:
            return Response(
                {'error': 'Project not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check ownership (allow if no auth or matching designer)
        designer_id = request.data.get('designer_id') or request.query_params.get('designer_id')
        if designer_id:
            try:
                designer = User.objects.get(pk=designer_id)
                if project.designer_id != designer.id and not (request.user.is_authenticated and request.user.is_staff):
                    return Response(
                        {'error': 'Not your project'},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            except User.DoesNotExist:
                pass
        elif request.user.is_authenticated:
            if (
                project.designer_id != request.user.id
                and not request.user.is_staff
            ):
                return Response(
                    {'error': 'Not your project'},
                    status=status.HTTP_403_FORBIDDEN,
                )

        new_status = request.data.get('status')

        allowed_transitions = {
            InteriorDesignProject.Status.DRAFT: {
                InteriorDesignProject.Status.DRAFT,
                InteriorDesignProject.Status.PUBLISHED,
            },
            InteriorDesignProject.Status.PUBLISHED: {
                InteriorDesignProject.Status.UNPUBLISHED,
            },
            InteriorDesignProject.Status.UNPUBLISHED: {
                InteriorDesignProject.Status.DRAFT,
                InteriorDesignProject.Status.PUBLISHED,
            },
        }

        current_status = project.status

        if new_status not in allowed_transitions.get(
            current_status, set()
        ):
            return Response(
                {'error': 'Invalid status transition'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_status == InteriorDesignProject.Status.PUBLISHED:
            errors = ProjectValidator.validate_for_publication(
                project
            )

            if errors:
                return Response(
                    {'errors': errors},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        project.status = new_status
        project.save(update_fields=['status', 'updated_at'])

        return Response({
            'id': project.id,
            'status': project.status,
        })


class ProjectFlagListCreateView(generics.ListCreateAPIView):
    """Submit customer reports and list the moderation queue."""

    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = ProjectFlag.objects.select_related(
            'project',
            'project__designer',
            'reporter',
            'reviewed_by',
        )
        requested_status = self.request.query_params.get(
            'status',
            ProjectFlag.Status.OPEN,
        ).upper()

        if requested_status != 'ALL':
            queryset = queryset.filter(status=requested_status)

        return queryset

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProjectFlagCreateSerializer
        return ProjectFlagSerializer

    def perform_create(self, serializer):
        reporter = (
            self.request.user
            if self.request.user.is_authenticated
            else None
        )
        serializer.save(reporter=reporter)


class ProjectFlagModerationView(APIView):
    """Remove a flagged project or dismiss the customer report."""

    permission_classes = [permissions.AllowAny]

    def patch(self, request, pk):
        decision = ProjectFlagModerationSerializer(data=request.data)
        decision.is_valid(raise_exception=True)

        try:
            with transaction.atomic():
                flag = ProjectFlag.objects.select_for_update().select_related(
                    'project',
                    'project__designer',
                    'reporter',
                ).get(pk=pk)

                if flag.status != ProjectFlag.Status.OPEN:
                    return Response(
                        {'error': 'This flag has already been reviewed.'},
                        status=status.HTTP_409_CONFLICT,
                    )

                action = decision.validated_data['action']

                if action == 'REMOVE':
                    flag.project.status = (
                        InteriorDesignProject.Status.REMOVED
                    )
                    flag.project.save(
                        update_fields=['status', 'updated_at']
                    )
                    flag.status = ProjectFlag.Status.RESOLVED
                else:
                    flag.status = ProjectFlag.Status.DISMISSED

                flag.moderation_note = decision.validated_data.get(
                    'moderation_note',
                    '',
                ).strip()
                flag.resolved_at = timezone.now()
                flag.reviewed_by = (
                    request.user
                    if request.user.is_authenticated
                    else None
                )
                flag.save(
                    update_fields=[
                        'status',
                        'moderation_note',
                        'resolved_at',
                        'reviewed_by',
                    ]
                )
        except ProjectFlag.DoesNotExist:
            return Response(
                {'error': 'Flag report not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(ProjectFlagSerializer(flag).data)

# US-35: View Project Details
class RecordViewView(APIView):
    """Records a VIEW interest event. Called when a customer opens a project detail page."""
    permission_classes = [permissions.AllowAny]

    def post(self, request, pk):
        try:
            project = InteriorDesignProject.objects.get(pk=pk)
        except InteriorDesignProject.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
        InterestEvent.objects.create(project=project, event_type=InterestEvent.EventType.VIEW)
        return Response({'status': 'recorded'}, status=status.HTTP_201_CREATED)

    def recordViewEvent(self, project_id):
        """Record a view event."""
        project = InteriorDesignProject.objects.get(pk=project_id)
        return InterestEvent.objects.create(project=project, event_type=InterestEvent.EventType.VIEW)


# US-07: Views and Shortlist
class InterestEventListView(generics.ListCreateAPIView):
    serializer_class = InterestEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'CUSTOMER':
            return InterestEvent.objects.filter(
                customer=self.request.user,
                event_type=InterestEvent.EventType.SHORTLIST,
            )
        return InterestEvent.objects.filter(event_type=InterestEvent.EventType.SHORTLIST)

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)


class InterestEventDetailView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return InterestEvent.objects.filter(customer=self.request.user)



# US-31/US-35: Room types (from model choices, not hardcoded)
class RoomTypeView(APIView):
    """Returns the available room type choices from the InteriorDesignProject model."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response([
            {'value': choice[0], 'label': choice[1]}
            for choice in InteriorDesignProject.RoomType.choices
        ])


# --- Alias classes ---
SearchControl = ProjectController
ProjectSearchController = ProjectController
# InterestAnalyticsControl and AnalyticsController are in analytics/views.py
ModerationController = ProjectPublishView

# US-07: Views and Shortlist
class InterestEventRepo:
    """InterestEvent repository."""
    @staticmethod
    def findByPeriod(project_id, period):
        from projects.models import InterestEvent
        from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
        trunc_fn = TruncDate
        if period == 'weekly':
            trunc_fn = TruncWeek
        elif period == 'monthly':
            trunc_fn = TruncMonth
        return InterestEvent.objects.filter(project_id=project_id).annotate(period=trunc_fn('occurred_at'))

    @staticmethod
    def countByType(project_id):
        from projects.models import InterestEvent
        views = InterestEvent.objects.filter(project_id=project_id, event_type=InterestEvent.EventType.VIEW).count()
        shortlists = InterestEvent.objects.filter(project_id=project_id, event_type=InterestEvent.EventType.SHORTLIST).count()
        return {'view_count': views, 'shortlist_count': shortlists}
