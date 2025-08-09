from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),  # Add this line
    path('', include('accounts.urls')),
]
def redirect_to_home(request):
    return redirect('home')
