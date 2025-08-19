from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings

class CustomUser(AbstractUser):
    # Add your custom fields here based on ERD
    # Example: Adding a phone field
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True) # Make unique if required, nullable if optional
    avatar = models.ImageField(
        _("Avatar"), 
        upload_to='user_avatars/',  # تصاویر در پوشه MEDIA_ROOT/user_avatars/ ذخیره می‌شوند
        null=True, 
        blank=True,
        help_text=_("User's profile picture")
    )
    # Add related_name to avoid clashes with default User model's groups and permissions
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        related_name="customuser_set", # Choose a different related_name
        related_query_name="user",
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name="customuser_set", # Choose a different related_name
        related_query_name="user",
    )
    points = models.PositiveIntegerField(default=0, verbose_name=_("User Points"))


    def __str__(self):
        return self.username

class Province(models.Model):
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name

class City(models.Model):
    name = models.CharField(max_length=100)
    province = models.ForeignKey(Province, on_delete=models.CASCADE, related_name='cities')

    def __str__(self):
        return f"{self.name} ({self.province.name})"
class Address(models.Model):
    """
    Represents a postal address associated with a user.
    A user can have multiple addresses.
    """
    # کاربری که این آدرس به او تعلق دارد
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("User"),
        on_delete=models.CASCADE, # اگر کاربر حذف شد، آدرس‌هایش هم حذف شوند
        related_name='addresses' # دسترسی از کاربر به آدرس‌ها: user.addresses.all()
    )
    # یک عنوان برای آدرس (مثلا خانه، محل کار - اختیاری)
    title = models.CharField(
        _("Title"),
        max_length=100,
        null=True, blank=True,
        help_text=_("e.g., Home, Work")
    )
    # شهر
    city = models.ForeignKey(City, verbose_name=_("City"), on_delete=models.PROTECT)
    # جزئیات آدرس (خیابان، کوچه، پلاک، ...)
    street = models.TextField(_("Street Address"))
    recipient_name = models.CharField(_("Recipient Name"), max_length=150) # نام گیرنده
    phone_number = models.CharField(_("Phone Number"), max_length=20)
    # کد پستی (اختیاری)
    postal_code = models.CharField(_("Postal Code"), max_length=20, null=True, blank=True)
    # آیا این آدرس پیش‌فرض کاربر است؟
    is_default = models.BooleanField(_("Is Default"), default=False)
    # نکته: برای اینکه فقط یک آدرس بتواند پیش‌فرض باشد،
    # باید منطقی در متد save مدل یا در Form/View پیاده‌سازی شود
    # که هنگام True کردن is_default برای یک آدرس، بقیه آدرس‌های کاربر False شوند.
    def save(self, *args, **kwargs):
        # اگر این آدرس قرار است به عنوان پیش‌فرض ذخیره شود
        if self.is_default:
            # تمام آدرس‌های *دیگر* این کاربر که در حال حاضر پیش‌فرض هستند را پیدا کن
            # و وضعیت پیش‌فرض بودن آن‌ها را False کن.
            # استفاده از .exclude(pk=self.pk) مهم است تا اگر در حال ویرایش آدرسی هستیم
            # که از قبل پیش‌فرض بوده، خود آن را از این کوئری خارج کنیم.
            Address.objects.filter(
                user=self.user, 
                is_default=True
            ).exclude(pk=self.pk).update(is_default=False)
        
        # حالا متد save اصلی کلاس پدر را فراخوانی کن تا این آدرس ذخیره شود.
        super().save(*args, **kwargs)
    class Meta:
        verbose_name = _("Address")
        verbose_name_plural = _("Addresses")
        ordering = ['user', '-is_default', 'title'] # مرتب‌سازی بر اساس کاربر، سپس پیش‌فرض، سپس عنوان
        # ممکن است بخواهید ترکیب کاربر و عنوان یکتا باشد (اختیاری)
        # unique_together = ('user', 'title')

    def __str__(self):
        # نمایش خوانا
        display_title = self.title if self.title else f"Address in {self.city}"
        default_marker = " (Default)" if self.is_default else ""
        return f"{display_title} for {self.user.username}{default_marker}"