from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Address

class CustomUserAdmin(UserAdmin):
    # UserAdmin fieldsets رو به ارث می‌بره و می‌تونیم سفارشی‌اش کنیم
    # اضافه کردن فیلدهای سفارشی به نمایش کاربر در ادمین
    # fieldsets استاندارد UserAdmin رو کپی می‌کنیم و فیلد خودمون (مثلاً phone) رو اضافه می‌کنیم
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('phone', 'avatar')}), # 'phone' فیلدی هست که به CustomUser اضافه کردیم
    )
    # اضافه کردن فیلدهای سفارشی به فرم ایجاد کاربر در ادمین
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Custom Fields', {'fields': ('phone', 'avatar')}),
    )
    # نمایش فیلدهای بیشتر در لیست کاربران
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'phone', 'avatar') # phone رو اضافه کردیم
    # اضافه کردن فیلد سفارشی به فیلدهای جستجو
    search_fields = UserAdmin.search_fields + ('phone','avatar')

@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'city', 'is_default')
    list_filter = ('is_default', 'city')
    search_fields = ('user__username', 'title', 'city', 'street', 'postal_code')

# ثبت مدل CustomUser با کلاس Admin سفارشی شده
admin.site.register(CustomUser, CustomUserAdmin)