from django.urls import path
from . import views

urlpatterns = [
    path('projects/', views.ProjectController.as_view(), name='project-list'),
    path('projects/<int:pk>/', views.ProjectDetailView.as_view(), name='project-detail'),
    path('projects/<int:pk>/publish/', views.ProjectPublishView.as_view(), name='project-publish'),
    path('projects/<int:pk>/record-view/', views.RecordViewView.as_view(), name='project-record-view'),
    path('projects/<int:pk>/view-count/', views.ViewCountView.as_view(), name='project-view-count'),
    path('projects/<int:pk>/shortlist-count/', views.ShortlistCountView.as_view(), name='project-shortlist-count'),
    path('interest-events/', views.InterestEventListView.as_view(), name='interest-event-list'),
    path('interest-events/<int:pk>/', views.InterestEventDetailView.as_view(), name='interest-event-detail'),
]