from django.contrib import admin
from django.urls import path, include

admin.site.site_header = "HASH Administration"
admin.site.site_title = "HASH site admin"
admin.site.index_title = "Welcome to HASH Administration"
admin.site.site_footer = "Powered by Django"

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    path('api/', include('projects.urls')),
    path('api/', include('categories.urls')),
    path('api/', include('analytics.urls')),
]