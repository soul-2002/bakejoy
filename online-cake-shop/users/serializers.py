# users/serializers.py
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
# مدل کاربر سفارشی خودمون رو ایمپورت می‌کنیم
from .models import City,Province,CustomUser,Address 
# یا اگر از مدل پیش‌فرض جنگو استفاده می‌کنید: from django.contrib.auth.models import User
# یا روش بهتر: from django.contrib.auth import get_user_model
# User = get_user_model() # اگر از get_user_model استفاده می‌کنید
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password # برای اعتبارسنجی قدرت پسورد (اختیاری ولی خوب)
from django.core.exceptions import ValidationError


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        # فیلدهایی که می‌خواهید در پاسخ API برگردانده شود
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
            'phone',          # <--- فیلد phone را هم اضافه کنید (اگر می‌خواهید در فرانت‌اند در دسترس باشد)
            'is_staff',       # <--- اضافه کردن is_staff برای تشخیص ادمین
            'is_superuser' ,
            'avatar','points'
        ]
        # می‌توانید فیلدهای دیگری هم اضافه کنید
        read_only_fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone', 'is_staff', 'is_superuser']

class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        # فقط فیلدهایی که کاربر اجازه آپدیت آن‌ها را دارد
        fields = ['first_name', 'last_name', 'phone']
class ProvinceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Province
        fields = ['id', 'name']

class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        fields = ['id', 'name']
        
class UserRegistrationSerializer(serializers.ModelSerializer):
    # فیلد password رو طوری تعریف می‌کنیم که فقط برای نوشتن باشه و در پاسخ برنگرده
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}, # در Browsable API به صورت فیلد پسورد نشون داده بشه
        validators=[validate_password] # استفاده از اعتبارسنج‌های پیش‌فرض جنگو برای پسورد
    )
    # می‌توانید یک فیلد تکرار پسورد هم برای اطمینان اضافه کنید
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        label=_("Confirm Password")
    )

    class Meta:
        model = CustomUser # مدل کاربر سفارشی ما
        # فیلدهایی که کاربر موقع ثبت‌نام باید وارد کنه
        fields = ('username', 'email', 'password', 'password2', 'phone', 'first_name', 'last_name') # فیلدهای first/last name و phone رو هم اضافه کردیم (اگر در مدل CustomUser دارید)
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
            'phone': {'required': False} # اگر این فیلدها اختیاری هستند
        }

    def validate(self, attrs):
        """
        اعتبارسنجی کلی - چک کردن برابری پسوردها
        """
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": _("Password fields didn't match.")})
        # می‌توانید اعتبارسنجی‌های دیگری هم اینجا اضافه کنید
        return attrs

    def create(self, validated_data):
        """
        ایجاد کاربر جدید با پسورد هش شده.
        """
        # password2 رو از داده‌های نهایی حذف می‌کنیم چون در متد create_user لازم نیست
        validated_data.pop('password2')

        # استفاده از متد create_user مدل User برای ساخت کاربر
        # این متد به طور خودکار پسورد رو هش می‌کنه
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''), # ایمیل اختیاری باشد یا required در Meta تعریف شود
            password=validated_data['password'],
            # بقیه فیلدها رو هم پاس می‌دیم
            phone=validated_data.get('phone'),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # اضافه کردن فیلدهای دلخواه به payload توکن access
        # این فیلدها بعداً در فرانت‌اند با jwtDecode قابل خواندن هستند
        token['username'] = user.username
        token['email'] = user.email
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        # می‌توانید فیلدهای غیرحساس دیگری هم اضافه کنید
        # از اضافه کردن اطلاعات حساس مثل is_staff یا گروه‌ها خودداری کنید مگر با احتیاط

        return token
    

class AddressSerializer(serializers.ModelSerializer):
    # اختیاری: نمایش نام کاربری به جای ID کاربر (فقط خواندنی)
    user = serializers.StringRelatedField(read_only=True)
    city_name = serializers.CharField(source='city.name', read_only=True)
    province_name = serializers.CharField(source='city.province.name', read_only=True)
    province_id = serializers.IntegerField(source='city.province.id', read_only=True)
    city_id = serializers.IntegerField(source='city.id', read_only=True)

    class Meta:
        model = Address
        # VVVV --- فقط فیلدهای موجود در مدل Address شما --- VVVV
        fields = [
            'id',
            'user','recipient_name',         # چون StringRelatedField گذاشتیم، نام کاربری را نشان می‌دهد
            'title',        # در مدل شما وجود دارد
           'province_name', 'city_name','city',
            'street',       # در مدل شما وجود دارد (نامش street است)
            'postal_code',  # در مدل شما وجود دارد
            'is_default',   # در مدل شما وجود دارد
           'phone_number'
           , 
            'province_id', 'city_id' # برای مقداردهی اولیه فرم ویرایش
        ]
        extra_kwargs = {
            'city': {'write_only': True}
        }
        
class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("رمز عبور فعلی شما صحیح نیست.")
        return value

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "تکرار رمز عبور جدید مطابقت ندارد."})
        
        # اعتبارسنجی پیش‌فرض جنگو برای قدرت رمز عبور
        validate_password(data['new_password'], self.context['request'].user)
        
        return data