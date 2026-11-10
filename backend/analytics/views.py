from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta, date
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from projects.models import InteriorDesignProject, InterestEvent

User = get_user_model()


# US-48: View Portfolio Interest Overview
class PortfolioInterestView(APIView):
    """Return a designer's projects and interest within a rolling reporting period."""
    permission_classes = [permissions.AllowAny]
    REPORTING_PERIODS = {'all': None, '7d': 7, '30d': 30, '90d': 90}

    def get(self, request):
        period = request.query_params.get('period', 'all')
        if period not in self.REPORTING_PERIODS:
            return Response(
                {'error': 'Invalid reporting period. Choose all, 7d, 30d, or 90d.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        designer_id = request.query_params.get('designer_id')
        if designer_id:
            try:
                designer = User.objects.get(pk=designer_id, role=User.Role.INTERIOR_DESIGNER)
            except (User.DoesNotExist, ValueError, OverflowError):
                return Response({'error': 'Designer not found'}, status=status.HTTP_404_NOT_FOUND)
        elif request.user.is_authenticated:
            designer = request.user
        else:
            designer = User.objects.filter(role=User.Role.INTERIOR_DESIGNER).first()
        if not designer:
            return Response({'error': 'No designer found'}, status=status.HTTP_404_NOT_FOUND)

        period_end = timezone.now()
        days = self.REPORTING_PERIODS[period]
        period_start = period_end - timedelta(days=days) if days is not None else None
        event_filter = Q(interest_events__occurred_at__lte=period_end)
        if period_start is not None:
            event_filter &= Q(interest_events__occurred_at__gte=period_start)

        # Filter the counts, not the projects: inactive projects must remain visible.
        projects = InteriorDesignProject.objects.filter(designer=designer).annotate(
            view_count=Count('interest_events', filter=event_filter & Q(
                interest_events__event_type=InterestEvent.EventType.VIEW)),
            shortlist_count=Count('interest_events', filter=event_filter & Q(
                interest_events__event_type=InterestEvent.EventType.SHORTLIST)),
        ).order_by('-shortlist_count', '-view_count', 'id')
        projects_data = []
        total_views = 0
        total_shortlists = 0

        for project in projects:
            vc = project.view_count
            sc = project.shortlist_count
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

        return Response({
            'designer_id': designer.id,
            'period': period,
            'period_start': period_start.isoformat() if period_start is not None else None,
            'period_end': period_end.isoformat(),
            'total_views': total_views,
            'total_shortlists': total_shortlists,
            'project_count': len(projects_data),
            'projects': projects_data,
        })

    def getOverview(self, designer_id, period):
        """Get portfolio overview."""
        return self.get(None)


# US-49: Track View and Shortlist Trends Over Time
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


# US-07: Views and Shortlist (view count)
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


# US-07: Views and Shortlist (shortlist count)
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


# --- Alias classes ---
InterestAnalyticsControl = PortfolioInterestView
AnalyticsController = PortfolioInterestView

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
