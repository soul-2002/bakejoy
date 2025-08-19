# orders/admin.py

from django.contrib import admin
# مدل‌هایی که در orders/models.py تعریف کردید رو ایمپورت کنید
from .models import Order, OrderItem, CustomDesign, OrderAddon, Transaction, Notification
from .models import SMSTemplate, Notification
# ثبت ساده مدل‌ها برای نمایش اولیه در پنل ادمین
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(CustomDesign)
admin.site.register(OrderAddon)
admin.site.register(Transaction)
# ----------------------------------------------------
# نکته: برای استفاده راحت‌تر و بهتر از پنل ادمین،
# بعداً می‌توانید برای هر مدل یک کلاس ModelAdmin سفارشی تعریف کنید.
# مثال (فقط برای نمایش، فعلاً لازم نیست اعمال کنید):
#
# class OrderItemInline(admin.TabularInline):
#     model = OrderItem
#     extra = 0 # تعداد ردیف خالی پیش‌فرض
#     readonly_fields = ('price_at_order', 'cake', 'flavor', 'size') # فیلدهای فقط خواندنی در این نما
#     # می‌توانید فیلدهای بیشتری برای نمایش اضافه کنید

# class OrderAdmin(admin.ModelAdmin):
#     list_display = ('id', 'user', 'status', 'delivery_datetime', 'total_price', 'created_at')
#     list_filter = ('status', 'created_at')
#     search_fields = ('id', 'user__username')
#     inlines = [OrderItemInline] # نمایش آیتم‌های سفارش در همان صفحه سفارش
#     date_hierarchy = 'created_at' # فیلتر سریع بر اساس تاریخ

# # برای اعمال کلاس سفارشی باید ثبت ساده قبلی را غیرفعال (کامنت) و این خط را فعال کنید:
# # admin.site.register(Order, OrderAdmin)
# ----------------------------------------------------

@admin.register(SMSTemplate)
class SMSTemplateAdmin(admin.ModelAdmin):
    list_display = ('event_trigger', 'description', 'is_active')
    list_filter = ('is_active', 'event_trigger')
    search_fields = ('description', 'message_template')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'order_link', 'type', 'status', 'sent_at', 'created_at')
    list_filter = ('type', 'status', 'created_at', 'sent_at')
    search_fields = ('user__username', 'user__email', 'message', 'order__id')
    readonly_fields = ('created_at', 'sent_at') # این فیلدها خودکار مقداردهی می‌شوند

    def order_link(self, obj):
        from django.urls import reverse
        from django.utils.html import format_html
        if obj.order:
            # مسیر به جزئیات سفارش در پنل ادمین جنگو (اگر مدل Order رجیستر شده)
            # app_label و model_name را با مقادیر صحیح جایگزین کنید
            link = reverse(f"admin:{obj.order._meta.app_label}_{obj.order._meta.model_name}_change", args=[obj.order.pk])
            return format_html('<a href="{}">Order #{}</a>', link, obj.order.id)
        return "-"
    order_link.short_description = "Related Order"