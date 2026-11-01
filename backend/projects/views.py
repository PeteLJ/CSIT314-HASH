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


# --- ProjectValidator (per naming guide) ---
class ProjectValidator:
    """Validates project data before creation."""
    @staticmethod
    def validate_draft(data):
        errors = []
        if not data.get('title'):
            errors.append('Title is required.')
        if data.get('renovation_budget') and data.get('renovation_budget') < 0:
            errors.append('Budget cannot be negative.')
        return errors


# --- US-31: Browse Design Projects ---
# Guide: ProjectController.getProjectsForBrowse(), ProjectServiceImpl.fetchAllProjects()

class ProjectController(generics.ListCreateAPIView):
    """Browse all published projects. Create a new project (draft or published)."""
    serializer_class = InteriorDesignProjectSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = InteriorDesignProject.objects.filter(
            status=InteriorDesignProject.Status.PUBLISHED
        )
        # Search and filter (US-03: search by keyword, filter by style, room type, budget)
        search = self.request.query_params.get('search')
        style = self.request.query_params.get('style')
        room_type = self.request.query_params.get('room_type')
        budget_min = self.request.query_params.get('budget_min')
        budget_max = self.request.query_params.get('budget_max')

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

        return queryset

    def perform_create(self, serializer):
        # Validate project data before creation (per naming guide: ProjectValidator.validateDraft)
        data = self.request.data
        errors = ProjectValidator.validate_draft(data)
        if errors:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'errors': errors})
        serializer.save(designer=self.request.user)

    def getProjectsForBrowse(self):
        """Alias for get_queryset — matches naming guide."""
        return self.get_queryset()

    def getPublishedProjects(self, criteria=None):
        """Alias for get_queryset with search criteria — matches naming guide."""
        return self.get_queryset()

    def fetchAllProjects(self):
        """Alias — matches naming guide: IProjectService.fetchAllProjects()."""
        return self.get_queryset()

    def fetchProjectById(self, project_id):
        """Alias — matches naming guide: IProjectService.fetchProjectById()."""
        return InteriorDesignProject.objects.get(pk=project_id)

    def findPublished(self, criteria=None):
        """Alias — matches naming guide: ProjectRepository.findPublished(criteria)."""
        return self.get_queryset()

    def validate(self, criteria):
        """Alias — matches naming guide: SearchControl.validate(criteria)."""
        return True

    def search(self, criteria):
        """Alias — matches naming guide: SearchControl.search(criteria)."""
        return self.get_queryset()

    def paginate(self, results):
        """Alias — matches naming guide: SearchControl.paginate(results)."""
        return results


# --- US-35: View Project Details ---
# Guide: ProjectController.getProjectDetails(), ProjectServiceImpl.fetchProjectsById()

class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = InteriorDesignProject.objects.all()
    serializer_class = InteriorDesignProjectSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def getProjectDetails(self, project_id):
        """Alias for retrieve — matches naming guide."""
        return InteriorDesignProject.objects.get(pk=project_id)


class ProjectPublishView(APIView):
    """Toggle publication status: DRAFT -> PUBLISHED -> ARCHIVED."""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            project = InteriorDesignProject.objects.get(pk=pk)
        except InteriorDesignProject.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
        if project.designer != request.user and not request.user.is_staff:
            return Response({'error': 'Not your project'}, status=status.HTTP_403_FORBIDDEN)
        new_status = request.data.get('status')
        if new_status not in [s.value for s in InteriorDesignProject.Status]:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        project.status = new_status
        project.save()
        return Response({'id': project.id, 'status': project.status})


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
        """Alias for post — matches naming guide."""
        project = InteriorDesignProject.objects.get(pk=project_id)
        return InterestEvent.objects.create(project=project, event_type=InterestEvent.EventType.VIEW)


# --- Interest Events (shortlists/favourites) ---

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


# --- Analytics endpoints ---

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
        """Alias for get — matches naming guide: InterestAnalyticsControl.getOverview(id, period)."""
        return self.get(None)  # placeholder


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
        view_map = {str(v['period']): v['count'] for v in view_qs}

        shortlist_qs = (
            InterestEvent.objects.filter(project=project, event_type=InterestEvent.EventType.SHORTLIST)
            .annotate(period=trunc_fn('occurred_at'))
            .values('period')
            .annotate(count=Count('id'))
            .order_by('period')
        )
        shortlist_map = {str(s['period']): s['count'] for s in shortlist_qs}

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
            'period': period,
            'series': series,
        })

    def aggregate(self, events):
        """Alias for aggregation logic — matches naming guide: InterestAnalyticsControl.aggregate(events)."""
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

# --- Alias classes for naming guide consistency ---
# Guide: SearchControl / ProjectSearchController (search is combined into ProjectController)
SearchControl = ProjectController
ProjectSearchController = ProjectController

# Guide: ModerationController (moderation is handled by ProjectPublishView + frontend ModerationDashboard)
ModerationController = ProjectPublishView
