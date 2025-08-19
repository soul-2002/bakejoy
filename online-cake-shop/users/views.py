# users/views.py
from rest_framework import generics, permissions, viewsets # generics رو اضافه کنید
# ایمپورت سریالایزر و مدل کاربر
from .serializers import ChangePasswordSerializer, CitySerializer, ProvinceSerializer,UserProfileUpdateSerializer,UserRegistrationSerializer, UserSerializer,AddressSerializer
from .models import City, CustomUser,Address, Province# یا: from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView                          # User = get_user_model()
from .serializers import MyTokenObtainPairSerializer # سریالایزر سفارشی رو ایمپورت کنید
# اگر AddressViewSet یا موارد دیگری در این فایل بود، سر جاشون باشن
from django.contrib.auth import get_user_model
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action

# View برای رجیستر کردن کاربر جدید
User = get_user_model()
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
class UserRegistrationView(generics.CreateAPIView):
    """
    API endpoint for user registration.
    """
    queryset = CustomUser.objects.all() # queryset باید تعریف بشه برای CreateAPIView
    serializer_class = UserRegistrationSerializer
    # هر کسی (حتی کاربر لاگین نکرده) باید بتونه ثبت‌نام کنه
    permission_classes = [permissions.AllowAny]
class CurrentUserDetailView(generics.RetrieveUpdateAPIView):
    """
    اطلاعات کاربر لاگین کرده فعلی را برمی‌گرداند.
    """
    serializer_class = UserSerializer
    # فقط کاربران لاگین کرده به این View دسترسی دارند
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # آبجکتی که باید سریالایز شود، کاربر خود درخواست است
        return self.request.user
    
    def get_serializer_class(self):
        # اگر درخواست از نوع PATCH بود، از سریالایزر آپدیت استفاده کن
        if self.request.method in ['PUT', 'PATCH']:
            return UserProfileUpdateSerializer
        # در غیر این صورت (برای GET)، از سریالایزر خواندنی استفاده کن
        return UserSerializer

class ProvinceListView(generics.ListAPIView):
    queryset = Province.objects.all()
    serializer_class = ProvinceSerializer
    permission_classes = [permissions.IsAuthenticated] # یا AllowAny

class CityListView(generics.ListAPIView):
    serializer_class = CitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        province_id = self.request.query_params.get('province_id')
        if province_id:
            return City.objects.filter(province_id=province_id)
        return City.objects.none()
class UserAddressListView(generics.ListCreateAPIView): # هم لیست و هم ایجاد
    """
    لیست آدرس‌های کاربر جاری را برمی‌گرداند یا آدرس جدید برای او ایجاد می‌کند.
    """
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated] # فقط کاربر لاگین کرده

    def get_queryset(self):
        # فیلتر کردن آدرس‌ها فقط برای کاربر درخواست دهنده
        return Address.objects.filter(user=self.request.user).order_by('-id')

    def perform_create(self, serializer):
        # هنگام ایجاد آدرس جدید، کاربر آن را برابر کاربر جاری قرار بده
        serializer.save(user=self.request.user)
class AddressViewSet(viewsets.ModelViewSet):
    """
    ViewSet کامل برای مدیریت آدرس‌های کاربر (CRUD کامل).
    """
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        فقط آدرس‌های کاربر لاگین کرده را برمی‌گرداند.
        این متد شماست و کاملاً درست است.
        """
        return Address.objects.filter(user=self.request.user).order_by('-is_default', '-id')

    def perform_create(self, serializer):
        """
        هنگام ایجاد آدرس، کاربر آن را برابر کاربر جاری قرار می‌دهد.
        این متد شماست و کاملاً درست است.
        """
        serializer.save(user=self.request.user)
    
    # --- اکشن جدید برای تنظیم آدرس پیش‌فرض ---
    @action(detail=True, methods=['post'], url_path='set-default')
    def set_default(self, request, pk=None):
        """
        یک آدرس را به عنوان آدرس پیش‌فرض کاربر تنظیم می‌کند.
        """
        address = self.get_object() # این متد آدرس با شناسه pk را برمی‌گرداند
        
        # تمام آدرس‌های دیگر این کاربر را از حالت پیش‌فرض خارج کن
        request.user.addresses.update(is_default=False)
        
        # آدرس فعلی را پیش‌فرض کن
        address.is_default = True
        address.save(update_fields=['is_default'])
        
        return Response({'status': 'success', 'message': 'آدرس پیش‌فرض با موفقیت تغییر کرد.'}, status=status.HTTP_200_OK)
class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({"detail": "رمز عبور با موفقیت تغییر یافت."}, status=status.HTTP_200_OK)
