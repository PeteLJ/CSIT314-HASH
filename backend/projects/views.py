from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Q
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from .models import InteriorDesignProject, InterestEvent
from .serializers import (
    InteriorDesignProjectSerializer,
    InterestEventSerializer,
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
        budget_min = self.request.query_params.get('budget_min')
        budget_max = self.request.query_params.get('budget_max')
        category = self.request.query_params.get('category')

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(style__icontains=search) | Q(room_type__icontains=search)
            )
        if style:
            queryset = queryset.filter(style__iexact=style)
        if room_type:
            queryset = queryset.filter(room_type__iexact=room_type)
        if budget_min:
            queryset = queryset.filter(budget_min__gte=budget_min)
        if budget_max:
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


# US-48: View Portfolio Interest Overview / US-49: Track View and Shortlist Trends Over Time
class PortfolioInterestView(APIView):
    """Returns total views, total shortlists, and ranked projects for a designer."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        designer_id = request.query_params.get('designer_id')
        if designer_id:
            try:
                designer = User.objects.get(pk=designer_id)
            except User.DoesNotExist:
                return Response({'error': 'Designer not found'}, status=status.HTTP_404_NOT_FOUND)
        elif request.user.is_authenticated:
            designer = request.user
        else:
            designer = User.objects.filter(role=User.Role.INTERIOR_DESIGNER).first()
        if not designer:
            return Response({'error': 'No designer found'}, status=status.HTTP_404_NOT_FOUND)

        projects = InteriorDesignProject.objects.filter(designer=designer)
        projects_data = []
        total_views = 0
        total_shortlists = 0

        for project in projects:
            vc = InterestEvent.objects.filter(project=project, event_type=InterestEvent.EventType.VIEW).count()
            sc = InterestEvent.objects.filter(project=project, event_type=InterestEvent.EventType.SHORTLIST).count()
            total_views += vc
            total_shortlists += sc
            projects_data.append({
                'id': project.id,
                'title': project.title,
                'style': project.style,
                'status': project.status,
                'view_count': vc,
                'shortlist_count': sc,
            })

        projects_data.sort(key=lambda x: (-x['shortlist_count'], -x['view_count']))

        return Response({
            'total_views': total_views,
            'total_shortlists': total_shortlists,
            'project_count': len(projects_data),
            'projects': projects_data,
        })

    def getOverview(self, designer_id, period):
        """Get portfolio overview."""
        return self.get(None)


class TrendChartView(APIView):
    """Returns view and shortlist counts bucketed by period for a single project."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            project = InteriorDesignProject.objects.get(pk=pk)
        except InteriorDesignProject.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

        period = request.query_params.get('period', 'daily')

        if period == 'weekly':
            trunc_fn = TruncWeek
        elif period == 'monthly':
            trunc_fn = TruncMonth
        else:
            trunc_fn = TruncDate

        view_qs = (
            InterestEvent.objects.filter(project=project, event_type=InterestEvent.EventType.VIEW)
            .annotate(period=trunc_fn('occurred_at'))
            .values('period')
            .annotate(count=Count('id'))
            .order_by('period')
        )
        view_map = {str(v['period'].date() if hasattr(v['period'], 'date') else v['period']): v['count'] for v in view_qs}

        shortlist_qs = (
            InterestEvent.objects.filter(project=project, event_type=InterestEvent.EventType.SHORTLIST)
            .annotate(period=trunc_fn('occurred_at'))
            .values('period')
            .annotate(count=Count('id'))
            .order_by('period')
        )
        shortlist_map = {str(s['period'].date() if hasattr(s['period'], 'date') else s['period']): s['count'] for s in shortlist_qs}

        # Build full date range (last 30 days for daily, last 12 weeks for weekly, last 12 months for monthly)
        if period == 'weekly':
            num_periods = 12
            delta = timedelta(weeks=1)
        elif period == 'monthly':
            num_periods = 12
            delta = timedelta(days=30)
        else:
            num_periods = 30
            delta = timedelta(days=1)

        # Generate all periods in range
        end_date = timezone.localdate() if period == 'daily' else timezone.now()
        if period == 'daily':
            all_dates = [end_date - timedelta(days=i) for i in range(num_periods - 1, -1, -1)]
            all_periods = [str(d) for d in all_dates]
        else:
            all_periods = sorted(set(view_map.keys()) | set(shortlist_map.keys()))

        series = []
        for p in all_periods:
            series.append({
                'period': p,
                'view_count': view_map.get(p, 0),
                'shortlist_count': shortlist_map.get(p, 0),
            })

        return Response({
            'project_id': project.id,
            'project_title': project.title,
            'designer_name': project.designer.username,
            'period': period,
            'series': series,
        })

    def aggregate(self, events):
        """Aggregate events."""
        pass


class ViewCountView(APIView):
    """Returns the view count for a single project."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            project = InteriorDesignProject.objects.get(pk=pk)
        except InteriorDesignProject.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
        count = InterestEvent.objects.filter(project=project, event_type=InterestEvent.EventType.VIEW).count()
        return Response({'project_id': project.id, 'view_count': count})


class ShortlistCountView(APIView):
    """Returns the shortlist count for a single project."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            project = InteriorDesignProject.objects.get(pk=pk)
        except InteriorDesignProject.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
        count = InterestEvent.objects.filter(project=project, event_type=InterestEvent.EventType.SHORTLIST).count()
        return Response({'project_id': project.id, 'shortlist_count': count})


# US-56: Moderate Flagged Project Content
class GenerateEventView(APIView):
    """Generates random view/shortlist events for demo purposes. Called periodically by the frontend."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        import random
        now = timezone.now()
        published = InteriorDesignProject.objects.filter(status=InteriorDesignProject.Status.PUBLISHED)
        if not published.exists():
            return Response({'status': 'no published projects'}, status=status.HTTP_200_OK)

        project = random.choice(list(published))
        num_views = random.randint(1, 3)
        for _ in range(num_views):
            InterestEvent.objects.create(
                project=project,
                event_type=InterestEvent.EventType.VIEW,
                occurred_at=now,
            )
        if random.random() < 0.2:
            customers = User.objects.filter(role=User.Role.CUSTOMER)
            if customers.exists():
                cust = random.choice(list(customers))
                try:
                    InterestEvent.objects.create(
                        project=project,
                        customer=cust,
                        event_type=InterestEvent.EventType.SHORTLIST,
                        occurred_at=now,
                    )
                except Exception:
                    pass

        return Response({
            'status': 'ok',
            'project': project.title,
            'views_added': num_views,
        })



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
InterestAnalyticsControl = PortfolioInterestView
AnalyticsController = PortfolioInterestView
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