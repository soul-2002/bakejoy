# orders/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings # برای دسترسی به مدل کاربر فعلی
from .models import Order, OrderStatusLog
# برای گرفتن کاربر فعلی در سیگنال‌ها (اگر تغییر توسط ادمین از پنل جنگو است یا نیاز به لاگ کردن کاربر سیستم دارید)
# این بخش می‌تواند پیچیده باشد. ساده‌ترین حالت این است که changed_by را null بگذاریم یا از request.user در ویو بگیریم.
# فعلاً فرض می‌کنیم changed_by می‌تواند null باشد یا در ویو ست شود.

@receiver(post_save, sender=Order)
def log_order_status_change(sender, instance, created, raw, using, update_fields, **kwargs):
    """
    هر بار که یک سفارش ذخیره می‌شود، اگر وضعیت آن تغییر کرده باشد، یک لاگ ثبت می‌کند.
    """
    if raw: # اگر داده‌ها از fixture لود می‌شوند، کاری نکن
        return

    # اگر فیلد status در لیست فیلدهای آپدیت شده وجود دارد یا اگر یک سفارش جدید ایجاد شده
    # (برای created، فرض می‌کنیم وضعیت اولیه هم یک نوع لاگ است)
    log_this_change = False
    if created:
        log_this_change = True
    elif update_fields and 'status' in update_fields:
        log_this_change = True
    elif not update_fields: # اگر update_fields مشخص نشده، یعنی ممکن است همه فیلدها آپدیت شده باشند
        # در این حالت باید وضعیت قبلی را با وضعیت فعلی مقایسه کنیم (کمی پیچیده‌تر)
        # برای سادگی فعلاً این حالت را در نظر نمی‌گیریم یا فرض می‌کنیم status همیشه در update_fields هست
        # یا اینکه اگر created نیست و update_fields هم نیست، یعنی save() کامل صدا زده شده و باید بررسی کنیم
        try:
            # این روش برای گرفتن وضعیت قبلی همیشه قابل اعتماد نیست اگر save کامل باشد
            # بهتر است در ویو، قبل از ذخیره، وضعیت قبلی را داشته باشیم
            # اما برای یک راه حل ساده‌تر در سیگنال:
            if instance.tracker.has_changed('status'): # اگر از django-model-utils یا مشابه استفاده می‌کنید
                log_this_change = True
            # اگر از django-model-utils استفاده نمی‌کنید، باید وضعیت قبلی را به روش دیگری پیدا کنید
            # یا اینکه لاگ را فقط برای created و زمانی که status در update_fields است، ثبت کنید.
        except: # اگر tracker وجود ندارد
             pass # یا یک لاگ ساده برای وضعیت ایجاد شده ثبت کنید اگر نیاز است

    if log_this_change:
        # چه کسی تغییر را اعمال کرده؟ این بخش نیاز به کار بیشتری دارد اگر می‌خواهید دقیق باشد.
        # اگر از داخل یک ویو با request.user تغییر وضعیت می‌دهید، بهتر است changed_by را در همان ویو ست کنید.
        # در سیگنال به request دسترسی مستقیم نداریم.
        # فعلاً changed_by را None می‌گذاریم یا باید راهی برای پاس دادن کاربر پیدا کنید.
        OrderStatusLog.objects.create(
            order=instance,
            new_status=instance.status, # یا instance.get_status_display() اگر می‌خواهید لیبل را ذخیره کنید
            # changed_by= ؟ (نیاز به منطق برای گرفتن کاربر فعلی)
            # notes= "وضعیت به ... تغییر یافت" (می‌توانید یک یادداشت پیش‌فرض بگذارید)
        )
        print(f"Order {instance.id} status logged as {instance.status}")