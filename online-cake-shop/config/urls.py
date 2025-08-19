"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include # include رو ایمپورت کنید
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView)
from users.views import MyTokenObtainPairView # <-- ایمپورت View سفارشی
from orders.views import zarinpal_payment_callback, CartDetailView


urlpatterns = [
    path('admin/', admin.site.urls),
    # path('api/v1/admin/panel/', include('orders.admin_urls')),
    path('api/v1/products/', include('products.urls')),
    path('api/v1/orders/', include('orders.urls')), # این خط درست است
    path('api/v1/admin/orders/', include('orders.admin_urls')),
    path('api/v1/auth/', include('users.urls')), # <-- کاما فراموش نشود اگر خط بعدی وجود دارد
    path('api/v1/cart/', CartDetailView.as_view(), name='cart-detail'),
    path('payment/callback/', zarinpal_payment_callback, name='payment_callback'),
    path('api/v1/admin/products/', include('products.admin_urls')), # URL های ادمین محصولات
    # >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    path('api/v1/auth/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/users/', include('users.urls')),

    # <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
]

# تنظیمات مربوط به نمایش فایل‌های مدیا در حالت توسعه (اگر قبلاً اضافه نکردید)
from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

