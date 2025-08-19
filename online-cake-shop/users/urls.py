# users/urls.py

from django.urls import path, include # include را هم اضافه کنید
from rest_framework.routers import DefaultRouter
# UserAddressListView حذف شد چون AddressViewSet کامل‌تر است
from .views import AddressViewSet, CityListView, ProvinceListView, UserRegistrationView, CurrentUserDetailView, ChangePasswordView

app_name = 'users'

# روتر برای مدیریت خودکار URL های AddressViewSet
router = DefaultRouter()
router.register(r'addresses', AddressViewSet, basename='address')

# لیست URL ها
urlpatterns = [
    # مسیرهای ساخته شده توسط روتر (شامل /addresses/ و /addresses/{pk}/)
    path('', include(router.urls)), # <-- روتر به این شکل اضافه می‌شود
    
    # سایر مسیرهای شما
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('me/', CurrentUserDetailView.as_view(), name='user-me'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('provinces/', ProvinceListView.as_view(), name='province-list'),
    path('cities/', CityListView.as_view(), name='city-list'),
    
    # این خط تکراری بود و حذف شد
    # path('addresses/', UserAddressListView.as_view(), name='user-address-list-create')
]