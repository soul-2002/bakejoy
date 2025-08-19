# orders/views.py

# --- Import های لازم ---
import requests
import os
from django.urls import reverse
from django.conf import settings
from rest_framework.decorators import action
from django.core.cache import cache 
from rest_framework.response import Response
from rest_framework import status, viewsets, permissions, mixins,filters
from rest_framework.exceptions import ValidationError # برای خطاهای اعتبارسنجی
from django.http import Http404
from rest_framework.views import APIView
from rest_framework import serializers
from django.utils import timezone 
from django_filters.rest_framework import DjangoFilterBackend # برای فیلترینگ پیشرفته
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from datetime import timedelta
from django.db.models.functions import TruncDate
import jdatetime
from weasyprint import HTML, CSS
from django.conf import settings
from django.template.loader import render_to_string
from django.db import transaction
from django.contrib.contenttypes.models import ContentType


import traceback
from django.db.models import Sum, Count, Q # برای کوئری های تجمعی و شرطی
from django.contrib.auth.models import User # برای آمار کاربران
# ایمپورت مدل‌ها
from .models import Order, OrderItem, Transaction, Cake, Flavor, Size,Notification,OrderStatusLog # مدل‌ها # Transaction فعلا فقط در pay استفاده شده
# مدل‌های دیگر را هم اگر سریالایزر جدید یا منطق قیمت‌گذاری نیاز دارد، وارد کنید
from products.models import Cake, Flavor, Size # فرض بر اینکه مدل محصول Cake است
from django.contrib.auth import get_user_model
from django.shortcuts import redirect, get_object_or_404
from django.http import HttpResponse, Http404 # Http404 را هم اضافه کنید
from django.conf import settings
import requests
import json
from django.utils.translation import gettext_lazy as _
from django.db.models import Count, Q

# ایمپورت سریالایزرها
from .serializers import (
   OrderStatusLogSerializer,InternalOrderNoteSerializer,NotificationLogSerializer,SMSTemplateSerializer,AdminDashboardStatsSerializer,OrderItemReadSerializer,CartItemUpdateSerializer, OrderSerializer, OrderItemSerializer, OrderItemAddSerializer,AdminOrderStatusUpdateSerializer, OrderCheckoutUpdateSerializer  # سریالایزر جدید برای افزودن آیتم
)
# -------------------------
from .sms_service import send_order_status_sms # اگر در همین اپ orders است
from .models import SMSTemplate
frontend_base_url = getattr(settings, 'FRONTEND_URL', '/')
failure_url = f"{frontend_base_url}/payment/failure"
User = get_user_model()

import csv # <--- ماژول csv پایتون را وارد کنید
from django.http import HttpResponse # <--- برای ارسال پاسخ CSV
class AdminDashboardStatsView(APIView):
    """
    Provides key statistics for the admin dashboard.
    """
    permission_classes = [permissions.IsAdminUser] # فقط دسترسی ادمین

    def get(self, request, *args, **kwargs):
        now = timezone.now()
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        # وضعیت هایی که نشانه درآمد قطعی هستند (مثال)
        # شما باید این را با وضعیت های نهایی و موفق خودتان تنظیم کنید
        revenue_statuses = [Order.OrderStatusChoices.DELIVERED, Order.OrderStatusChoices.PROCESSING]
        # یا اگر وضعیت COMPLETED دارید:
        # revenue_statuses = [Order.OrderStatusChoices.DELIVERED, Order.OrderStatusChoices.COMPLETED]

        # محاسبه آمارها
        cancelled_orders_count = Order.objects.filter(status=Order.OrderStatusChoices.CANCELLED).count()
        delivered_orders_count = Order.objects.filter(status=Order.OrderStatusChoices.DELIVERED).count()
        todays_orders_count = Order.objects.filter(created_at__date=now.date()).exclude(status=Order.OrderStatusChoices.CART).count()

        pending_payment_orders_count = Order.objects.filter(status=Order.OrderStatusChoices.PENDING_PAYMENT).count()
        processing_orders_count = Order.objects.filter(status=Order.OrderStatusChoices.PROCESSING).count()
        total_orders_count = Order.objects.exclude(status=Order.OrderStatusChoices.CART).count()
        total_users_count = User.objects.count()
        active_products_count = Cake.objects.filter(is_active=True).count()

        total_revenue_month_agg = Order.objects.filter(
            status__in=revenue_statuses,
            created_at__gte=current_month_start
        ).aggregate(total=Sum('total_price'))
        total_revenue_month = total_revenue_month_agg['total'] or 0

        today_revenue_agg = Order.objects.filter(
            status__in=revenue_statuses,
            created_at__gte=today_start
        ).aggregate(total=Sum('total_price'))
        today_revenue = today_revenue_agg['total'] or 0

        # آماده سازی داده برای سریالایزر
        data = {
            'todays_orders_count': todays_orders_count,
            'delivered_orders_count': delivered_orders_count,
            'cancelled_orders_count': cancelled_orders_count,
            'pending_orders_count': pending_payment_orders_count, # اسم را به pending_payment تغییر دادم
            'processing_orders_count': processing_orders_count,
            'total_orders_count': total_orders_count,
            'total_users_count': total_users_count,
            'active_products_count': active_products_count,
            'total_revenue_month': total_revenue_month,
            'today_revenue': today_revenue,
        }

        serializer = AdminDashboardStatsSerializer(data=data)
        # توجه: چون خودمان داده را ساخته‌ایم و از دیتابیس نخوانده‌ایم،
        # نیازی به instance نیست و باید is_valid() را صدا بزنیم تا مطمئن شویم
        # داده‌های محاسبه شده با فیلدهای سریالایزر مطابقت دارند.
        serializer.is_valid(raise_exception=True) # اگر داده‌ها معتبر نبودند خطا می‌دهد

        return Response(serializer.data)

# ViewSet اصلی برای مدیریت سفارشات توسط ادمین
class CustomAdminOrderPagination(PageNumberPagination):
    page_size_query_param = 'limit'  # <--- مهم: به DRF می‌گوید پارامتر 'limit' را برای اندازه صفحه بخواند
    page_size = 10  # اندازه صفحه پیش‌فرض اگر limit ارسال نشود (برای لیست کامل سفارشات)
    max_page_size = 100 # اختیاری

class AdminOrderViewSet(viewsets.ReadOnlyModelViewSet):
    queryset =Order.objects.filter(is_deleted=False).select_related(
        'user', 'address'
    ).prefetch_related(
        'items__content_object', 'items__flavor', 'items__size_variant', 'transactions'
    ).order_by('-created_at')
    serializer_class = OrderSerializer # سریالایزر اصلی برای خواندن سفارش
    permission_classes = [permissions.IsAdminUser]
    pagination_class = CustomAdminOrderPagination
    filter_backends = [
        DjangoFilterBackend, # برای فیلترهای دقیق مانند status
        filters.SearchFilter,  # برای جستجو در متن
        filters.OrderingFilter # برای مرتب‌سازی (شما قبلاً ordering پیش‌فرض دارید)
    ]

    # تعریف فیلدهایی که می‌خواهید بر اساس آن‌ها فیلتر دقیق انجام شود
    # این به پارامتر query شما (مثلاً ?status=PROCESSING) اجازه می‌دهد کار کند
    filterset_fields = {
        'status': ['exact'], # 'exact' یعنی مطابقت دقیق با مقدار داده شده
        # می‌توانید فیلدهای دیگری را هم برای فیلتر دقیق اضافه کنید، مثلا:
        # 'user__id': ['exact'], // برای فیلتر بر اساس شناسه کاربر
    }

    # تعریف فیلدهایی که پارامتر query 'search' باید در آن‌ها جستجو کند
    search_fields = [
        'id',                 # جستجو در شماره سفارش (اگر شماره سفارش همان id است)
        'user__username',     # جستجو در نام کاربری
        'user__first_name',   # جستجو در نام مشتری
        'user__last_name',    # جستجو در نام خانوادگی مشتری
        'user__email',        # جستجو در ایمیل مشتری
        'address__street',    # جستجو در آدرس خیابان
        'address__city',      # جستجو در شهر آدرس
        # می‌توانید فیلدهای دیگری هم برای جستجو اضافه کنید
    ]
    ordering_fields = ['created_at', 'total_price', 'status', 'user__username']
    ordering = ['-created_at'] # مرتب‌سازی پیش‌فرض شما
    

    def get_queryset(self):
        queryset = super().get_queryset().filter(is_deleted=False)
        date_filter_param = self.request.query_params.get('date_filter', None)

        if date_filter_param:
            today_gregorian = timezone.now().date() # تاریخ میلادی امروز

            if date_filter_param == 'today': # فیلتر "امروز" همچنان می‌تواند میلادی باشد
                queryset = queryset.filter(created_at__date=today_gregorian)
            
            elif date_filter_param == 'last_7_days': # فیلتر "۷ روز گذشته" میلادی
                seven_days_ago = today_gregorian - timedelta(days=6)
                queryset = queryset.filter(created_at__date__gte=seven_days_ago, created_at__date__lte=today_gregorian)

            # --- مدیریت گزینه‌های شمسی ---
            elif date_filter_param == 'this_shamsi_month':
                current_shamsi_date = jdatetime.date.today()
                start_of_shamsi_month_gregorian = jdatetime.date(current_shamsi_date.year, current_shamsi_date.month, 1).togregorian()
                
                # محاسبه روز آخر ماه شمسی
                if current_shamsi_date.month <= 6:
                    last_day_of_shamsi_month = 31
                elif current_shamsi_date.month <= 11:
                    last_day_of_shamsi_month = 30
                else: # اسفند
                    last_day_of_shamsi_month = 29 if not current_shamsi_date.isleap() else 30
                
                end_of_shamsi_month_gregorian = jdatetime.date(current_shamsi_date.year, current_shamsi_date.month, last_day_of_shamsi_month).togregorian()
                
                queryset = queryset.filter(created_at__date__gte=start_of_shamsi_month_gregorian, 
                                           created_at__date__lte=end_of_shamsi_month_gregorian)

            elif date_filter_param == 'last_shamsi_month':
                current_shamsi_date = jdatetime.date.today()
                # محاسبه ماه و سال شمسی قبلی
                if current_shamsi_date.month == 1:
                    last_month_year_shamsi = current_shamsi_date.year - 1
                    last_month_month_shamsi = 12
                else:
                    last_month_year_shamsi = current_shamsi_date.year
                    last_month_month_shamsi = current_shamsi_date.month - 1
                
                start_of_last_shamsi_month_gregorian = jdatetime.date(last_month_year_shamsi, last_month_month_shamsi, 1).togregorian()
                
                if last_month_month_shamsi <= 6:
                    last_day_of_last_shamsi_month = 31
                elif last_month_month_shamsi <= 11:
                    last_day_of_last_shamsi_month = 30
                else: # اسفند
                    # برای سال کبیسه شمسی، باید سال شمسی که در آن هستیم را بررسی کنیم
                    last_day_of_last_shamsi_month = 29 if not jdatetime.date(last_month_year_shamsi, 1, 1).isleap() else 30 
                                                        # (یا از خود jdatetime.date(last_month_year_shamsi, last_month_month_shamsi, 1).isleap() اگر دقیق‌تر است)
                
                end_of_last_shamsi_month_gregorian = jdatetime.date(last_month_year_shamsi, last_month_month_shamsi, last_day_of_last_shamsi_month).togregorian()

                queryset = queryset.filter(created_at__date__gte=start_of_last_shamsi_month_gregorian, 
                                           created_at__date__lte=end_of_last_shamsi_month_gregorian)
            # می‌توانید سایر گزینه‌های تاریخ شمسی را به همین ترتیب اضافه کنید
            
        return queryset
    @action(detail=False, methods=['get'], url_path='export-csv', permission_classes=[permissions.IsAdminUser])
    def export_csv(self, request):
        # ۱. دریافت کوئری‌ست فیلتر شده (همان کوئری‌ستی که در لیست نمایش داده می‌شود)
        # متد filter_queryset از DRF، فیلترهای تعریف شده در filter_backends 
        # (مانند search, status, و ordering) را روی get_queryset اعمال می‌کند.
        queryset = self.filter_queryset(self.get_queryset()) 
                                    # get_queryset شما هم فیلتر تاریخ را اعمال می‌کند.

        # ۲. ایجاد پاسخ HTTP با content_type مناسب برای CSV
        response = HttpResponse(
            content_type='text/csv; charset=utf-8', # charset=utf-8 برای پشتیبانی از فارسی
            headers={'Content-Disposition': 'attachment; filename="orders_export.csv"'},
        )
        response.write(u'\ufeff'.encode('utf8')) # BOM برای نمایش صحیح فارسی در Excel

        # ۳. ایجاد یک CSV writer
        writer = csv.writer(response)

        # ۴. نوشتن ردیف هدر (عناوین ستون‌ها)
        # این فیلدها را مطابق با نیاز خودتان انتخاب کنید
        headers = [
            'ID سفارش', 'نام کاربری مشتری', 'ایمیل مشتری', 'نام مشتری', 'نام خانوادگی مشتری',
            'وضعیت سفارش', 'مبلغ کل (تومان)', 'تاریخ ایجاد', 'زمان ایجاد',
            'آدرس کامل', 'شهر', 'کد پستی', 'یادداشت‌های سفارش', 'کد رهگیری پستی'
            # می‌توانید جزئیات آیتم‌ها را هم به صورت خلاصه اضافه کنید، اما ممکن است پیچیده شود
        ]
        writer.writerow(headers)

        # ۵. نوشتن داده‌های سفارشات در CSV
        for order in queryset:
            user_username = order.user.username if order.user else 'N/A'
            user_email = order.user.email if order.user else 'N/A'
            user_first_name = order.user.first_name if order.user else ''
            user_last_name = order.user.last_name if order.user else ''

            full_address = ""
            city = ""
            postal_code = ""
            if order.address:
                full_address = order.address.street # فرض کنید street همان آدرس کامل است
                city = order.address.city
                postal_code = order.address.postal_code

            writer.writerow([
                order.id,
                user_username,
                user_email,
                user_first_name,
                user_last_name,
                order.get_status_display(), # نمایش لیبل فارسی وضعیت
                order.total_price,
                order.created_at.strftime('%Y-%m-%d') if order.created_at else '', # فرمت تاریخ
                order.created_at.strftime('%H:%M:%S') if order.created_at else '', # فرمت زمان
                full_address,
                city,
                postal_code,
                order.notes,
                order.tracking_code
            ])

        return response
    @action(detail=False, methods=['get'], url_path='export-pdf', permission_classes=[permissions.IsAdminUser])
    def export_pdf(self, request):
        # ۱. وارد کردن WeasyPrint (بهتر است در بالای فایل باشد، اما برای نمایش اینجا گذاشتم)
        try:
            from weasyprint import HTML, CSS
            from django.conf import settings # برای دسترسی به STATIC_URL یا مسیر فونت‌ها
        except ImportError:
            # اگر WeasyPrint یا وابستگی‌هایش نصب نشده باشند
            return HttpResponse("خطا: کتابخانه WeasyPrint به درستی نصب نشده است.", status=500)

        # ۲. دریافت کوئری‌ست فیلتر شده
        queryset = self.filter_queryset(self.get_queryset())

        # ۳. آماده‌سازی context برای ارسال به قالب HTML
        context = {
            'orders': queryset,
            # می‌توانید اطلاعات دیگری هم به context اضافه کنید، مثلاً تاریخ گزارش، نام کاربر ادمین و ...
        }

        # ۴. رندر کردن قالب HTML به رشته
        try:
            html_string = render_to_string('orders/admin_order_list_pdf.html', context)
        except Exception as e:
            return HttpResponse(f"خطا در رندر کردن قالب HTML برای PDF: {e}", status=500)

        # ۵. تبدیل رشته HTML به PDF با WeasyPrint
        try:
            # اگر فونت‌های شما در مسیر استاتیک هستند و می‌خواهید WeasyPrint به آن‌ها دسترسی داشته باشد:
            # font_config = FontConfiguration()
            # css = CSS(string='@font-face { font-family: Vazirmatn; src: url(%sfonts/Vazirmatn-Regular.ttf); }' % settings.STATIC_URL, font_config=font_config)
            # به جای STATIC_URL می‌توانید از مسیر کامل فایل فونت استفاده کنید اگر در جای دیگری است.
            # یا اگر @font-face را مستقیماً در HTML template خود تعریف کرده‌اید، معمولاً WeasyPrint آن را پیدا می‌کند.

            # ساده‌ترین حالت (اگر @font-face در HTML است و مسیرها درست هستند):
            html = HTML(string=html_string, base_url=request.build_absolute_uri('/')) # base_url برای یافتن فایل‌های استاتیک (مثل فونت یا تصاویر) مهم است
            pdf_file = html.write_pdf()
            # اگر از CSS جداگانه استفاده می‌کنید:
            # pdf_file = html.write_pdf(stylesheets=[CSS(settings.STATIC_ROOT + '/css/your_pdf_styles.css')])

        except Exception as e:
            # لاگ کردن خطا برای بررسی بیشتر
            print(f"خطا در تولید PDF با WeasyPrint: {e}") # این را با سیستم لاگ‌گیری جایگزین کنید
            return HttpResponse(f"خطا در تولید فایل PDF: {e}. لطفاً وابستگی‌های WeasyPrint را بررسی کنید.", status=500)

        # ۶. ایجاد پاسخ HTTP با محتوای PDF
        response = HttpResponse(pdf_file, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="لیست_سفارشات.pdf"' # یا "orders_export.pdf"

        return response           
    @action(detail=False, methods=['post'], url_path='bulk-update-status', permission_classes=[permissions.IsAdminUser])
    def bulk_update_status(self, request):
        order_ids = request.data.get('order_ids')
        new_status_key = request.data.get('status') # کلید وضعیت جدید، مثلا 'PROCESSING'

        # ۱. اعتبارسنجی ورودی‌ها
        if not isinstance(order_ids, list) or not order_ids:
            return Response(
                {'detail': 'لیست ID های سفارشات (order_ids) ارائه نشده یا خالی است.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not new_status_key:
            return Response(
                {'detail': 'وضعیت جدید (status) ارائه نشده است.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # بررسی اینکه آیا وضعیت جدید معتبر است (مطابق با OrderStatusChoices)
        valid_statuses = [choice[0] for choice in Order.OrderStatusChoices.choices]
        if new_status_key not in valid_statuses:
            return Response(
                {'detail': f"وضعیت '{new_status_key}' برای سفارشات نامعتبر است."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ۲. به‌روزرسانی سفارشات
        updated_count = 0
        not_found_ids = []
        error_during_update_ids = []

        # برای اجرای متد save() و سیگنال‌های احتمالی هر سفارش، روی آن‌ها پیمایش می‌کنیم.
        # اگر تعداد سفارشات بسیار زیاد است، روش bulk_update جنگو کارآمدتر است،
        # اما متد save() را فراخوانی نمی‌کند.
        queryset = Order.objects.filter(id__in=order_ids)
        
        # بررسی اینکه آیا تمام ID های درخواستی معتبر هستند
        if queryset.count() != len(set(order_ids)): # استفاده از set برای حذف ID های تکراری احتمالی از ورودی
            found_ids = set(queryset.values_list('id', flat=True))
            not_found_ids = [order_id for order_id in set(order_ids) if order_id not in found_ids]
            if not_found_ids:
                 return Response(
                    {'detail': f"یک یا چند شناسه سفارش نامعتبر یا یافت نشد: {not_found_ids}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        for order in queryset:
            old_status = order.status
            if old_status != new_status_key:
                order.status = new_status_key
                try:
                    order.save(update_fields=['status', 'updated_at']) # فقط فیلدهای لازم را آپدیت کن
                    updated_count += 1
                    print(f"Order ID {order.id} status updated to '{new_status_key}' by admin {request.user.username}.")
                    try:
                        OrderStatusLog.objects.create(
                            order=order, 
                            new_status=order.status, # وضعیت جدید که ذخیره شده
                            changed_by=request.user, 
                            notes=f"وضعیت از '{old_status}' به '{order.get_status_display()}' توسط ادمین {request.user.username} تغییر کرد."
                        )
                        print(f"Status change logged for Order ID {order.id}.")
                    except Exception as log_e:
                        # اگر در لاگ کردن خطا رخ داد، نباید کل عملیات را متوقف کند
                        # اما باید این خطا را در سیستم لاگ‌گیری اصلی خود ثبت کنید
                            print(f"CRITICAL: Failed to log status change for Order ID {order.id}: {log_e}")
                    # TODO (اختیاری): ارسال پیامک برای هر سفارش آپدیت شده
                    # این بخش را با دقت در نظر بگیرید چون ممکن است تعداد زیادی پیامک ارسال شود.
                    # شاید بخواهید برای عملیات گروهی، پیامک ارسال نکنید یا یک نوع پیامک متفاوت ارسال کنید.
                    # try:
                    #     send_order_status_sms(order, new_status_key)
                    # except Exception as sms_e:
                    #     print(f"CRITICAL: Error sending SMS for bulk updated order {order.id}: {sms_e}")
                    #     # این خطا نباید مانع از ادامه عملیات گروهی شود
                    
                except Exception as e:
                    print(f"Error updating order {order.id} during bulk update: {e}")
                    error_during_update_ids.append(order.id)
        
        if error_during_update_ids:
             return Response(
                {
                    'detail': f"{updated_count} سفارش به‌روز شد، اما برای سفارشات با ID {error_during_update_ids} خطایی رخ داد.",
                    'updated_count': updated_count,
                    'failed_ids': error_during_update_ids
                }, 
                status=status.HTTP_207_MULTI_STATUS # یا یک وضعیت مناسب دیگر
            )

        return Response(
            {'detail': f'{updated_count} سفارش با موفقیت به وضعیت "{dict(Order.OrderStatusChoices.choices).get(new_status_key, new_status_key)}" به‌روز شدند.'},
            status=status.HTTP_200_OK
        )
    @action(detail=True, methods=['patch'], url_path='update-status', serializer_class=AdminOrderStatusUpdateSerializer)
    def update_status(self, request, pk=None):
        order = self.get_object() # گرفتن آبجکت سفارش
        
        # استفاده از self.get_serializer برای گرفتن نمونه‌ای از AdminOrderStatusUpdateSerializer
        # و پاس دادن instance, data, و partial=True
        # partial=True مهم است چون فقط فیلد status را می‌خواهیم آپدیت کنیم.
        update_serializer = self.get_serializer(instance=order, data=request.data, partial=True)

        if update_serializer.is_valid():
            new_status_from_payload = update_serializer.validated_data.get('status')
            old_status = order.status

            # بررسی اینکه آیا فیلد status در درخواست PATCH ارسال شده یا خیر
            if new_status_from_payload is None:
                # اگر status در درخواست نباشد (و سریالایزر آن را required نکرده باشد که با partial=True معمولاً اینطور است)،
                # یعنی تغییری برای وضعیت درخواست نشده.
                print(f"No new status provided for Order ID {order.id}. Status remains '{old_status}'.")
                # اطلاعات فعلی سفارش را با سریالایزر اصلی برمی‌گردانیم
                response_serializer = OrderSerializer(order, context={'request': request}) 
                return Response(response_serializer.data)

            if old_status != new_status_from_payload:
                try:
                    # ModelSerializer به طور خودکار instance.status = new_status_from_payload
                    # و سپس instance.save() را انجام می‌دهد.
                    updated_order = update_serializer.save() 
                    print(f"Order ID {updated_order.id} status successfully updated to '{updated_order.status}' in database by admin {request.user.username}.")

                    # --- ارسال پیامک اطلاع‌رسانی ---
                    try:
                        # event_trigger_key (updated_order.status) باید با مقادیر در SMSTemplate.event_trigger مطابقت داشته باشد
                        sms_sent, sms_gateway_message, sms_gateway_data = send_order_status_sms(updated_order, updated_order.status)
                        
                        if sms_sent:
                            print(f"SMS notification for order {updated_order.id} (new status: {updated_order.status}) submitted successfully. Gateway Msg: {sms_gateway_message}")
                        else:
                            print(f"SMS notification for order {updated_order.id} (new status: {updated_order.status}) failed or no template/recipient. Gateway Msg: {sms_gateway_message}")
                    except Exception as e_sms: 
                        print(f"CRITICAL: Unexpected error sending SMS for order {updated_order.id} after status update: {e_sms}")
                    
                    # --- ثبت لاگ تغییر وضعیت ---
                    try:
                        OrderStatusLog.objects.create(
                            order=updated_order, 
                            new_status=updated_order.status, 
                            changed_by=request.user,
                            notes=f"وضعیت از '{old_status}' به '{updated_order.get_status_display()}' توسط ادمین {request.user.username} تغییر کرد (تکی)."
                        )
                        print(f"Status change logged for Order ID {updated_order.id} (single update).")
                    except Exception as e_log: 
                        print(f"CRITICAL: Failed to log status change for Order ID {updated_order.id} (single update): {e_log}")
                
                except Exception as e_save: # خطای احتمالی در update_serializer.save() اصلی
                    print(f"Error saving order status update for Order ID {order.id}: {e_save}")
                    return Response({'detail': _("An error occurred while updating the order status.")}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                # بازگرداندن سریالایزر اصلی (OrderSerializer) برای نمایش اطلاعات کامل سفارش آپدیت شده
                response_serializer = OrderSerializer(updated_order, context={'request': request}) 
                return Response(response_serializer.data)
            
            else: # وضعیت ارسالی با وضعیت فعلی یکی است و تغییری لازم نیست
                print(f"Order ID {order.id} status ('{old_status}') was not changed (new status is the same). No SMS or log needed.")
                # اطلاعات فعلی سفارش را با سریالایزر اصلی برمی‌گردانیم
                response_serializer = OrderSerializer(order, context={'request': request}) 
                return Response(response_serializer.data)
        else:
            # اگر داده‌های ورودی برای AdminOrderStatusUpdateSerializer معتبر نبود
            print(f"Admin status update validation failed for Order ID {order.id if order else 'N/A'}: {update_serializer.errors}")
            return Response(update_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    @action(detail=True, methods=['get'], url_path='generate-invoice-pdf', permission_classes=[permissions.IsAdminUser])
    def generate_invoice_pdf(self, request, pk=None):
        order = self.get_object()
        print(f"--- اکشن generate_invoice_pdf فراخوانی شد برای سفارش ID: {pk} ---")

        try:
            print(">>> مرحله ۱: تلاش برای ایمپورت WeasyPrint...")
            from weasyprint import HTML, CSS
            from django.conf import settings
            print(">>> WeasyPrint با موفقیت ایمپورت شد.")
        except ImportError as e_import:
            print(f"!!! خطای ImportError برای WeasyPrint: {e_import}")
            print(traceback.format_exc())
            return HttpResponse(f"خطا در ایمپورت کتابخانه WeasyPrint: {e_import}", status=500)
        except OSError as e_os:
            print(f"!!! خطای OSError هنگام ایمپورت WeasyPrint: {e_os}")
            print(traceback.format_exc())
            return HttpResponse(f"خطای سیستمی هنگام بارگذاری WeasyPrint (OSError): {e_os}", status=500)
        except Exception as e_general_import:
            print(f"!!! خطای عمومی هنگام ایمپورت WeasyPrint: {e_general_import}")
            print(traceback.format_exc())
            return HttpResponse(f"خطای نامشخص هنگام ایمپورت WeasyPrint: {e_general_import}", status=500)
        # می‌توانید هرگونه اطلاعات اضافی که در قالب فاکتور لازم دارید را اینجا آماده کنید
        # مثلاً اطلاعات فروشگاه شما از تنظیمات یا یک مدل دیگر
        context = {
            'order': order,
            'shop_name': 'BAKEJÖY', # مثال
            'shop_address': 'تهران، خیابان شیرینی، پلاک ۱۰', # مثال
            'shop_phone': '۰۲۱-۱۲۳۴۵۶۷۸', # مثال
            # سایر اطلاعات لازم برای فاکتور
        }

        print(f">>> مرحله ۲: Context آماده شد: {list(context.keys())}")
        html_string = None
        try:
            print(f">>> مرحله ۳: تلاش برای رندر کردن قالب 'orders/admin_order_invoice_pdf.html'...")
            html_string = render_to_string('orders/admin_order_invoice_pdf.html', context)
            print(">>> قالب HTML با موفقیت رندر شد.")
        except Exception as e_template:
            print(f"!!! خطا در رندر کردن قالب HTML برای PDF: {e_template}")
            print(traceback.format_exc())
            return HttpResponse(f"خطا در رندر کردن قالب HTML برای PDF: {e_template}", status=500)

        pdf_file = None
        if html_string:
            try:
                print(">>> مرحله ۴: تلاش برای تولید PDF با WeasyPrint...")
                html_doc = HTML(string=html_string, base_url=request.build_absolute_uri('/'))
                pdf_file = html_doc.write_pdf()
                print(">>> فایل PDF با موفقیت توسط WeasyPrint تولید شد.")
            except Exception as e_weasyprint:
                print(f"!!! خطا در تولید PDF با WeasyPrint: {e_weasyprint}")
                print(traceback.format_exc())
                return HttpResponse(f"خطا در تولید فایل PDF با WeasyPrint: {e_weasyprint}", status=500)

        if pdf_file:
            print(">>> مرحله ۵: ارسال پاسخ PDF...")
            response = HttpResponse(pdf_file, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="invoice_order_{order.id}.pdf"'
            return response
        else:
            print("!!! فایل PDF ساخته نشد!")
            return HttpResponse("خطای نامشخص در سرور هنگام تولید PDF.", status=500)
    @action(detail=False, methods=['post'], url_path='bulk-delete-orders', permission_classes=[permissions.IsAdminUser])
    def bulk_delete_orders(self, request):
        order_ids_str = request.data.get('order_ids')

        if not isinstance(order_ids_str, list) or not order_ids_str:
            return Response(
                {'detail': 'لیست ID های سفارشات (order_ids) ارائه نشده یا خالی است.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order_ids = []
        for item_id in order_ids_str:
            try:
                order_ids.append(int(item_id))
            except ValueError:
                return Response(
                    {'detail': f"شناسه سفارش نامعتبر است: '{item_id}'. تمام شناسه‌ها باید عدد صحیح باشند."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # به‌روزرسانی فیلد is_deleted برای سفارشات انتخاب شده
        # متد update() برای کوئری‌ست، متد save() هر آبجکت را فراخوانی نمی‌کند
        # و سیگنال‌ها را نیز ارسال نمی‌کند، اما برای عملیات گروهی سریع‌تر است.
        # اگر نیاز به اجرای منطق خاصی در save() یا سیگنال‌ها هنگام "حذف نرم" دارید، باید روی سفارشات پیمایش کنید.
        updated_count = Order.objects.filter(id__in=order_ids, is_deleted=False).update(is_deleted=True, updated_at=timezone.now())
        # updated_at را هم دستی آپدیت می‌کنیم چون update() متد save را صدا نمی‌زند.

        if updated_count == 0 and order_ids:
            # ممکن است ID ها معتبر نباشند یا قبلاً is_deleted=True شده باشند
            # یک بررسی دقیق‌تر برای یافتن ID های نامعتبر می‌تواند اضافه شود اگر لازم است
            return Response(
                {'detail': 'هیچ سفارشی برای حذف نرم یافت نشد (ممکن است ID ها نامعتبر باشند یا قبلاً حذف شده باشند).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {'detail': f'{updated_count} سفارش با موفقیت به عنوان حذف شده علامت‌گذاری شدند.'},
            status=status.HTTP_200_OK
        )
    @action(detail=True, methods=['get'], url_path='internal-notes', permission_classes=[permissions.IsAdminUser])
    def list_internal_notes(self, request, pk=None):
        order = self.get_object() # سفارش والد را بر اساس pk از URL می‌گیرد
        notes = order.internal_notes.all() # استفاده از related_name
        serializer = InternalOrderNoteSerializer(notes, many=True, context={'request': request})
        return Response(serializer.data)
    @action(detail=True, methods=['post'], url_path='add-internal-note', permission_classes=[permissions.IsAdminUser])
    def add_internal_note(self, request, pk=None):
        order = self.get_object() # سفارش والد

        # داده‌ها را از درخواست می‌خوانیم، فقط note_text لازم است
        serializer = InternalOrderNoteSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            # کاربر فعلی (ادمین لاگین کرده) را به عنوان ثبت کننده یادداشت در نظر می‌گیریم
            # و سفارش والد را هم از URL می‌گیریم
            serializer.save(user=request.user, order=order)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    @action(detail=True, methods=['get'], url_path='status-history', permission_classes=[permissions.IsAdminUser])
    def status_history(self, request, pk=None):
        """
        تاریخچه تغییرات وضعیت برای سفارش با شناسه pk را برمی‌گرداند.
        """
        order = self.get_object() # سفارش والد را بر اساس pk از URL می‌گیرد (متد get_object از ViewSet)
        
        # لاگ‌های وضعیت مربوط به این سفارش را از طریق related_name ('status_logs') می‌خوانیم
        # related_name را در مدل OrderStatusLog برای فیلد order تعریف کرده بودیم.
        status_logs_queryset = order.status_logs.all() # .order_by('-timestamp') هم می‌تواند اینجا باشد اگر در Meta مدل نیست

        # می‌توانید برای این لیست هم صفحه‌بندی در نظر بگیرید اگر تعداد لاگ‌ها می‌تواند خیلی زیاد شود
        # page = self.paginate_queryset(status_logs_queryset)
        # if page is not None:
        #     serializer = OrderStatusLogSerializer(page, many=True, context={'request': request})
        #     return self.get_paginated_response(serializer.data)

        serializer = OrderStatusLogSerializer(status_logs_queryset, many=True, context={'request': request})
        return Response(serializer.data)

class OrderViewSet(mixins.CreateModelMixin,
                   mixins.ListModelMixin,
                   mixins.RetrieveModelMixin,
                    mixins.UpdateModelMixin,
                   viewsets.GenericViewSet):
    """
    API endpoint for user orders.
    Handles:
      - GET /api/v1/orders/ : List user's orders (excluding carts).
      - POST /api/v1/orders/ : Add item to user's cart.
      - GET /api/v1/orders/{pk}/ : Retrieve details of a specific order.
      - POST /api/v1/orders/{pk}/pay/ : Initiate payment for an order.
    """
    # سریالایزر پیش‌فرض برای list و retrieve
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    # --- تعیین سریالایزر بر اساس اکشن ---
    def get_serializer_class(self):
        if self.action == 'create':
            return OrderItemAddSerializer
        elif self.action in ['update', 'partial_update']:
             return OrderCheckoutUpdateSerializer
        elif self.action == 'pay':
             return serializers.Serializer # یا سریالایزر خالی مناسب
        # اگر می‌خواهید برای اکشن pay سریالایزر مشخصی داشته باشید
        # elif self.action == 'pay':
        #     return SomePaymentSerializer
        # برای بقیه اکشن ها مثل list, retrieve
        return OrderSerializer
    def partial_update(self, request, *args, **kwargs):
        """
        Updates the cart order with address/delivery time and changes status to PENDING_PAYMENT.
        Handles PATCH requests to /orders/{pk}/.
        """
        # گرفتن آبجکت سفارش (سبد خرید)
        # get_object از lookup field (معمولا pk) استفاده می‌کند
        order = self.get_object() # این متد خودش 404 می‌دهد اگر پیدا نشود

        # 1. بررسی مالکیت سفارش
        if order.user != request.user:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND) # یا 403 Forbidden

        # 2. بررسی وضعیت فعلی سفارش
        if order.status != Order.OrderStatusChoices.CART:
            return Response(
                {"detail": f"Cannot update order with status '{order.get_status_display()}'. Only carts can be checked out."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. اعتبارسنجی داده‌های ورودی با سریالایزر جدید
        # partial=True چون فقط فیلدهای ارسالی آپدیت می‌شوند (رفتار PATCH)
        serializer = self.get_serializer(order, data=request.data, partial=True)
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError as e:
             print(f"Checkout Update Validation Error: {e.detail}")
             return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

        # 4. ذخیره تغییرات (آدرس، زمان تحویل، یادداشت‌ها) توسط سریالایزر
        try:
            # serializer.save() فیلدهای address, delivery_datetime, notes را آپدیت می‌کند
            updated_order = serializer.save()
        except Exception as e:
             print(f"Error saving order update: {e}")
             return Response({"detail": "Failed to update order details."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


        # 5. تغییر وضعیت به "در انتظار پرداخت"
        updated_order.status = Order.OrderStatusChoices.PENDING_PAYMENT
        updated_order.save(update_fields=['status'])
        print(f"Order {updated_order.id} status changed to PENDING_PAYMENT.")

        # 6. برگرداندن پاسخ با داده‌های کامل سفارش آپدیت شده (با سریالایزر اصلی)
        # !! نکته: سریالایزر پاسخ را OrderSerializer می‌گذاریم تا تمام اطلاعات برگردد !!
        response_serializer = OrderSerializer(updated_order, context={'request': request})
        return Response(response_serializer.data)

    # --- بازنویسی کامل متد Create برای افزودن آیتم به سبد ---
    def create(self, request, *args, **kwargs):
        """
        یک آیتم محصول (کیک یا لوازم جشن) را به سبد خرید کاربر اضافه می‌کند.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data
        user = request.user

        # ۱. پیدا کردن یا ایجاد سبد خرید کاربر
        cart_order, _ = Order.objects.get_or_create(
            user=user,
            status=Order.OrderStatusChoices.CART
        )
        
        # ۲. گرفتن آبجکت محصول از داده‌های اعتبارسنجی شده
        # (این آبجکت در متد validate سریالایزر OrderItemAddSerializer ساخته شده)
        product_instance = validated_data.get('content_object')
        
        # ۳. پیدا کردن آیتم مشابه برای جلوگیری از تکرار
        # ما بر اساس content_type و object_id جستجو می‌کنیم
        content_type = ContentType.objects.get_for_model(product_instance)
        
        item_in_cart, created = OrderItem.objects.get_or_create(
            order=cart_order,
            content_type=content_type,
            object_id=product_instance.id,
            # برای کیک‌ها، طعم و سایز هم باید در کلید یکتایی در نظر گرفته شوند
            flavor=validated_data.get('flavor'),
            size_variant=validated_data.get('size_variant'),
            defaults={
                'quantity': validated_data.get('quantity'),
                'notes': validated_data.get('notes'),
            }
        )
        
        # ۴. اگر آیتم از قبل موجود بود، فقط تعداد را اضافه کن
        if not created:
            item_in_cart.quantity += validated_data.get('quantity', 1)
            # متد save را فراخوانی می‌کنیم تا قیمت کل سبد هم آپدیت شود
            item_in_cart.save() 
        
        # ۵. برگرداندن پاسخ
        response_serializer = OrderItemReadSerializer(item_in_cart, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    def get_queryset(self):
        """
        فقط سفارش‌های نهایی کاربر را برمی‌گرداند (نه سبد خرید).
        یا می‌توانید سبد خرید را هم برگردانید و در فرانت‌اند فیلتر کنید.
        """
        # برای حذف سبد خرید از لیست:
        return Order.objects.filter(user=self.request.user).exclude(
        status=Order.OrderStatusChoices.CART
    ).order_by('-created_at')
        # برای نمایش همه (شامل سبد خرید):
        # return Order.objects.filter(user=self.request.user).order_by('-created_at')

    # perform_create دیگر استفاده نمی‌شود چون create را بازنویسی کردیم
    # def perform_create(self, serializer):
    #     pass # حذف شود
    def get_object(self):
        """
        یک سفارش خاص (شامل سبد خرید) را برای کاربر فعلی بر اساس pk برمی‌گرداند.
        برای اکشن‌های retrieve, update, partial_update, pay استفاده می‌شود.
        """
        # گرفتن pk از URL
        pk = self.kwargs.get('pk')
        if pk is None:
            raise Http404("Order ID not provided in URL")

        try:
            # جستجو بر اساس کاربر و pk، بدون فیلتر وضعیت
            order = Order.objects.get(user=self.request.user, pk=pk)
            # شما می‌توانید بررسی‌های دسترسی بیشتری هم اینجا انجام دهید اگر لازم بود
            # self.check_object_permissions(self.request, order) # اگر permission های object-level دارید
            return order
        except Order.DoesNotExist:
            # اگر سفارشی با این pk برای این کاربر وجود نداشت، 404 برگردان
            raise Http404("No Order matches the given query for this user.")
        except ValueError: # اگر pk معتبر نبود (مثلا رشته بود)
            raise Http404("Invalid Order ID format.")
# ^^^^--- پایان متد get_object ---^^^^
    @action(detail=True, methods=['post'], url_path='pay')
    def pay(self, request, pk=None):
            """
            Starts the payment process for a specific order using Zarinpal.
            Handles POST requests to /api/v1/orders/{pk}/pay/
            """
            try: # یک try کلی برای گرفتن خطاهای احتمالی مثل get_object
                order = self.get_object() # گرفتن آبجکت سفارش بر اساس pk از URL
            except Http404: # اگر get_object خطا داد
                return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

            print(f"--- Pay Action: Initiating payment for Order ID: {order.id} ---")

            # 1. بررسی وضعیت سفارش (فقط سفارش‌های در انتظار پرداخت)
            # !! مطمئن شوید وضعیت PENDING_PAYMENT در مدل Order تعریف شده !!
            if order.status not in [Order.OrderStatusChoices.PENDING_PAYMENT, Order.OrderStatusChoices.PAYMENT_FAILED]:
                print(f"DEBUG pay: Returning 400 - Wrong Status: {order.status}")
                return Response(
                    {"detail": f"Order status is '{order.get_status_display()}'. Payment can only be initiated for orders pending payment."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 2. خواندن مرچنت کد زرین‌پال
            merchant_id = os.environ.get('ZARINPAL_MERCHANT_ID')
            if not merchant_id:
                print("CRITICAL ERROR: ZARINPAL_MERCHANT_ID not set.")
                # در محیط واقعی این خطا باید لاگ شود نه فقط پرینت
                return Response({"detail": "Payment gateway configuration error."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # 3. آماده‌سازی اطلاعات برای زرین‌پال
            # !!! واحد مبلغ (ریال/تومان) و عدد صحیح بودن را چک کنید !!!
            try:
                # قیمت کل را از مدل بخوانید (که باید قبلا محاسبه شده باشد)
                amount_toman = order.total_price
                # اطمینان از اینکه مبلغ صفر نیست (زرین‌پال معمولا مبلغ مثبت می‌خواهد)
                if amount_toman is None or amount_toman <= 0:
                    print(f"DEBUG pay: Returning 400 - Invalid Amount (Toman): {amount_toman}")
                    return Response({"detail": "Order amount must be positive."}, status=status.HTTP_400_BAD_REQUEST)
                amount_rial = int(amount_toman * 10) # تبدیل تومان به ریال (زرین‌پال معمولا ریال می‌خواهد)            
            except (ValueError, TypeError):
                print(f"CRITICAL ERROR: Could not convert order total price '{order.total_price}' to integer.")
                return Response({"detail": "Invalid order amount."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            description = f"Payment for Order #{order.id} - {settings.SITE_NAME}" # اسم سایت از settings
            email = order.user.email if order.user and order.user.email else ''
            mobile = order.user.phone if order.user and order.user.phone else ''

            # 4. ساخت Callback URL
            # !! باید یک URL با نام 'payment_callback' در urls.py تعریف کنید !!
            try:
                # از request.build_absolute_uri استفاده کنید تا آدرس کامل ساخته شود
                callback_url = request.build_absolute_uri(reverse('payment_callback'))
                print(f"DEBUG pay: Callback URL generated: {callback_url}")
            except Exception as e:
                print(f"CRITICAL ERROR: Could not reverse URL for 'payment_callback'. Is it defined in urls.py? Error: {e}")
                return Response({"detail": "Callback URL configuration error."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


            # 5. ایجاد رکورد تراکنش اولیه
            # !! مطمئن شوید مدل Transaction و TransactionStatusChoices.PENDING وجود دارد !!
            try:
                transaction = Transaction.objects.create(
                    order=order,
                    amount=amount_rial,
                    status=Transaction.TransactionStatusChoices.PENDING
                )
                print(f"Created initial transaction (ID: {transaction.id}) for Order {order.id}")
            except Exception as e:
                print(f"CRITICAL ERROR: Could not create Transaction record. Error: {e}")
                return Response({"detail": "Failed to initiate transaction record."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


            # 6. ارسال درخواست به زرین‌پال
            # آدرس سندباکس یا اصلی زرین‌پال
            zarinpal_url = settings.ZARINPAL_REQUEST_URL # از settings.py بخوانید

            payload = {
                "merchant_id": merchant_id,
                "amount": amount_rial,
                "description": description,
                "callback_url": callback_url,
                "metadata": {"email": email, "mobile": mobile}
            }
            print(f"DEBUG pay: Sending request to Zarinpal URL: {zarinpal_url} with payload: {payload}")

            try:
                response = requests.post(zarinpal_url, json=payload, timeout=15) # افزایش timeout
                response.raise_for_status() # خطاهای HTTP مثل 4xx/5xx
                zarinpal_data = response.json()
                print(f"DEBUG pay: Received response from Zarinpal: {zarinpal_data}")

                # 7. پردازش پاسخ زرین‌پال
                # ساختار پاسخ ممکن است کمی متفاوت باشد، مستندات زرین‌پال را چک کنید
                if zarinpal_data.get("data") and zarinpal_data["data"].get("code") == 100:
                    authority = zarinpal_data["data"]["authority"]
                    payment_url = settings.ZARINPAL_STARTPAY_URL + authority # از settings.py بخوانید
                    print(f"DEBUG pay: Zarinpal success! Authority: {authority}, Payment URL: {payment_url}")

                    transaction.gateway_reference_id = authority # ذخیره Authority
                    transaction.save(update_fields=['gateway_reference_id'])

                    print("DEBUG pay: Returning 200 - Zarinpal Success") # <--- لاگ موفقیت
                    return Response({"payment_url": payment_url}, status=status.HTTP_200_OK)
                else:
                    # مدیریت خطاهای زرین‌پال (مثل کد 101 یا سایر کدها)
                    error_code = zarinpal_data.get("errors", {}).get("code", "N/A")
                    error_message = zarinpal_data.get("errors", {}).get("message", "Unknown error from Zarinpal")
                    print(f"DEBUG pay: Returning 400 - Zarinpal Error. Code: {error_code}, Message: {error_message}") # <--- لاگ خطا

                    transaction.status = Transaction.TransactionStatusChoices.FAILED
                    transaction.gateway_response = f"Error Code: {error_code} - {error_message}"
                    transaction.save(update_fields=['status', 'gateway_response'])
                    return Response({"detail": f"Zarinpal Error: {error_message} (Code: {error_code})"}, status=status.HTTP_400_BAD_REQUEST)

            except requests.exceptions.RequestException as e:
                # خطای شبکه
                print(f"DEBUG pay: Returning 503 - Network Error connecting to Zarinpal: {e}") # <--- لاگ خطا
                transaction.status = Transaction.TransactionStatusChoices.FAILED
                transaction.gateway_response = f"Network Error: {e}"
                transaction.save(update_fields=['status', 'gateway_response'])
                return Response({"detail": "Could not connect to payment gateway."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            except Exception as e:
                # سایر خطاهای پیش‌بینی نشده در پردازش پاسخ
                print(f"DEBUG pay: Returning 500 - Unexpected error processing Zarinpal response: {e}") # <--- لاگ خطا
                transaction.status = Transaction.TransactionStatusChoices.FAILED
                transaction.gateway_response = f"Unexpected Error during Zarinpal processing: {e}"
                transaction.save(update_fields=['status', 'gateway_response'])
                return Response({"detail": "Unexpected error processing payment response."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # اطمینان از وجود یک return در انتهای متد (اگرچه نباید به اینجا برسد)
            print("DEBUG pay: ERROR - Reached end of pay function unexpectedly!")
            return Response({"detail": "Failed to process payment request."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    @action(detail=True, methods=['get'], url_path='my-status-history', permission_classes=[permissions.IsAuthenticated])
    def my_status_history(self, request, pk=None):
        order = self.get_object()
        
        # اطمینان حاصل کنید که کاربر فقط به سفارش خودش دسترسی دارد
        if order.user != request.user:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        status_logs = order.status_logs.all()
        serializer = OrderStatusLogSerializer(status_logs, many=True)
        return Response(serializer.data)
    @action(detail=True, methods=['post'], url_path='reorder', permission_classes=[permissions.IsAuthenticated])
    @transaction.atomic # برای اطمینان از اینکه تمام عملیات با هم انجام یا لغو شوند
    def reorder(self, request, pk=None):
        """
        آیتم‌های یک سفارش قدیمی را به سبد خرید فعال کاربر اضافه می‌کند.
        """
        # ۱. سفارش اصلی که قرار است کپی شود را بگیر
        original_order = self.get_object()

        # ۲. بررسی امنیتی: کاربر فقط می‌تواند سفارش خود را مجدداً سفارش دهد
        if original_order.user != request.user:
            return Response(
                {'detail': 'You do not have permission to perform this action.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # ۳. سبد خرید فعال کاربر را پیدا کن یا یک سبد جدید برایش بساز
        cart, created = Order.objects.get_or_create(
            user=request.user,
            status=Order.OrderStatusChoices.CART
        )

        # ۴. آیتم‌های سفارش قدیمی را به سبد خرید جدید اضافه کن
        for old_item in original_order.items.all():
            # بررسی کن آیا آیتم مشابه (همان کیک، سایز و طعم) از قبل در سبد خرید وجود دارد؟
            item_in_cart, item_created = cart.items.get_or_create(
                cake=old_item.cake,
                size_variant=old_item.size_variant,
                flavor=old_item.flavor,
                defaults={'quantity': old_item.quantity} # اگر آیتم جدید است، این مقدار را بگذار
            )

            # اگر آیتم از قبل در سبد خرید بود، فقط تعدادش را اضافه کن
            if not item_created:
                item_in_cart.quantity += old_item.quantity
                item_in_cart.save()
            
            # نکته: قیمت جدید (price_at_order) باید به صورت خودکار با قیمت روز محصول
            # در متد save() مدل OrderItem محاسبه شود، نه اینکه از سفارش قدیمی کپی شود.

        # ۵. قیمت کل سبد خرید را به‌روزرسانی کن
        cart.update_total_price() # فرض می‌کنیم متدی برای این کار در مدل Order دارید
        cart.refresh_from_db()
        # ۶. سبد خرید به‌روز شده را به کاربر برگردان
        serializer = self.get_serializer(cart)
        return Response(serializer.data, status=status.HTTP_200_OK)
class SalesDataAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, *args, **kwargs):
        # پارامترهای کوئری برای بازه زمانی (مثلاً ?period=7d, ?period=30d, ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD)
        period = request.query_params.get('period', '7d') # پیش‌فرض: ۷ روز اخیر
        # statuses_for_revenue = [Order.OrderStatusChoices.DELIVERED, Order.OrderStatusChoices.PROCESSING, Order.OrderStatusChoices.COMPLETED]
        # شما باید این وضعیت‌ها را با مدل خودتان تطبیق دهید
        statuses_for_revenue = [
            Order.OrderStatusChoices.PROCESSING,
            Order.OrderStatusChoices.SHIPPED,
            Order.OrderStatusChoices.DELIVERED,
            # Order.OrderStatusChoices.COMPLETED, # اگر دارید
        ]


        end_date = timezone.now()
        if period == '7d':
            start_date = end_date - timedelta(days=6) # شامل امروز، پس ۶ روز قبل
        elif period == '30d':
            start_date = end_date - timedelta(days=29)
        # TODO: می‌توانید منطق بیشتری برای بازه‌های سفارشی با start_date و end_date اضافه کنید
        else: # پیش‌فرض یا دوره نامعتبر
            start_date = end_date - timedelta(days=6)

        # کوئری برای گرفتن مجموع فروش روزانه در بازه مشخص
        # فقط سفارش‌هایی با وضعیت نهایی شده (پرداخت موفق و تکمیل یا ارسال شده) را در نظر می‌گیریم
        sales_data = Order.objects.filter(
            created_at__date__gte=start_date.date(), # استفاده از created_at__date برای مقایسه فقط تاریخ
            created_at__date__lte=end_date.date(),
            status__in=statuses_for_revenue # فیلتر بر اساس وضعیت‌های درآمدزا
        ).annotate(
            date=TruncDate('created_at') # تاریخ را به روز گرد کن (بدون ساعت و دقیقه)
        ).values(
            'date' # بر اساس تاریخ گروه‌بندی کن
        ).annotate(
            total_sales=Sum('total_price') # مجموع قیمت کل سفارشات در هر روز
        ).order_by('date') # مرتب‌سازی بر اساس تاریخ

        # فرمت کردن داده‌ها برای نمودار
        # اطمینان از وجود تمام روزها در بازه، حتی اگر فروشی نداشته‌اند (با مقدار صفر)
        formatted_data = []
        current_date = start_date.date()
        sales_dict = {item['date']: item['total_sales'] for item in sales_data}

        while current_date <= end_date.date():
            formatted_data.append({
                # تاریخ را به فرمت YYYY-MM-DD برای کتابخانه‌های نمودار تبدیل می‌کنیم
                'date': current_date.strftime('%Y-%m-%d'),
                'total_sales': float(sales_dict.get(current_date, 0)) # اگر روزی فروش نداشته، صفر در نظر بگیر
            })
            current_date += timedelta(days=1)
            
        return Response(formatted_data)

class CartDetailView(APIView):
    """
    API endpoint to retrieve the current user's shopping cart (Order with CART status).
    Handles GET requests to /api/v1/cart/ (یا هر مسیری که تعریف شود).
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderSerializer # برای مستندات و browsable API مفید است

    def get(self, request, *args, **kwargs):
        """
        Handles GET request to fetch the user's cart.
        """
        user = request.user
        print(f"--- CartDetailView: Fetching cart for user {user.username} ---")

        # پیدا کردن سبد خرید کاربر (سفارش با وضعیت CART)
        # استفاده از prefetch_related برای بهینه‌سازی و جلوگیری از N+1 query هنگام دسترسی به آیتم‌ها و جزئیاتشان
# orders/views.py -> داخل کلاس CartDetailView -> متد get

        cart_order = Order.objects.filter(
            user=user,
            status=Order.OrderStatusChoices.CART
        ).prefetch_related(
            'items', # آیتم‌های سفارش را prefetch کن
            'items__content_object', # خود آبجکت محصول (کیک یا لوازم جشن) را prefetch کن
            'items__flavor',         # طعم (برای کیک‌ها)
            'items__size_variant__size' # سایز (برای کیک‌ها)
        ).first()

        if cart_order:
            # اگر سبد خرید پیدا شد، آن را سریالایز کن
            print(f"Found cart (Order ID: {cart_order.id}) with {cart_order.items.count()} item(s)")
            # context را پاس می‌دهیم اگر سریالایزر نیاز داشته باشد (مثلا برای URL ها)
            serializer = self.serializer_class(cart_order, context={'request': request})
            return Response(serializer.data)
        else:
            # اگر سبد خریدی پیدا نشد، یک پاسخ مناسب برگردان
            print(f"No active cart found for user {user.username}")
            # می‌توانیم یک ساختار خالی شبیه به ساختار سریالایزر برگردانیم
            # تا فرانت‌اند راحت‌تر مدیریت کند
            return Response({
                "id": None,
                "user": user.username, # یا user.id
                "status": Order.OrderStatusChoices.CART,
                "status_display": Order.OrderStatusChoices.CART.label,
                "total_price": "0.00",
                "created_at": None,
                "updated_at": None,
                "items": [],
                "address": None,
                "delivery_datetime": None,
                "notes": None,
                # سایر فیلدهای OrderSerializer که ممکن است فرانت‌اند انتظار داشته باشد
            }, status=status.HTTP_200_OK) # وضعیت 200 با دیتای "خالی"

class SMSTemplateViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing SMS Templates.
    Allows admins to Create, Read, Update, and Delete SMS templates.
    """
    queryset = SMSTemplate.objects.all().order_by('event_trigger')
    serializer_class = SMSTemplateSerializer
    permission_classes = [permissions.IsAdminUser] # فقط ادمین‌ها به این ViewSet دسترسی دارند

    # می‌توانید permission های دقیق‌تری هم تنظیم کنید اگر لازم است
    # مثلاً همه ادمین‌ها بتوانند بخوانند، اما فقط سوپرادمین‌ها ویرایش کنند (با یک permission سفارشی)

    # می‌توانید perform_create, perform_update, perform_destroy را برای افزودن منطق سفارشی override کنید
    # اما برای CRUD ساده، ModelViewSet به تنهایی کافی است.
    lookup_field = 'event_trigger'
class NotificationLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing SMS notification logs.
    Allows admins to list, filter, and search SMS logs.
    """
    serializer_class = NotificationLogSerializer
    permission_classes = [permissions.IsAdminUser] # فقط ادمین‌ها دسترسی دارند

    # فیلترها برای جستجو و فیلترینگ پیشرفته
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # فیلدهایی که می‌توان بر اساس آن‌ها فیلتر کرد (نیاز به تعریف FilterSet دارد یا لیست ساده)
    # برای فیلترینگ ساده‌تر، می‌توانید از لیست رشته‌ها استفاده کنید:
    filterset_fields = {
        'status': ['exact'],                             # فیلتر بر اساس وضعیت دقیق (SENT, FAILED, PENDING)
        'type': ['exact'],                               # فیلتر بر اساس نوع (SMS)
        'created_at': ['gte', 'lte', 'exact', 'range'],  # فیلتر بر اساس بازه زمانی created_at
        'sent_at': ['gte', 'lte', 'exact', 'range'],     # فیلتر بر اساس بازه زمانی sent_at
        'order__id': ['exact'],                          # فیلتر بر اساس ID سفارش مرتبط
        'user__username': ['icontains'],                 # فیلتر بر اساس نام کاربری (شامل بخشی از نام)
    }
    # برای فیلترینگ پیشرفته‌تر و سفارشی، یک کلاس FilterSet جداگانه بسازید و آن را به filterset_class اختصاص دهید.

    # فیلدهایی که می‌توان در آن‌ها جستجو کرد
    search_fields = [
        'user__username',    # جستجو در نام کاربری
        'user__email',       # جستجو در ایمیل کاربر
        'order__id',         # جستجو با شماره سفارش
        'message',           # جستجو در متن پیامک
        'gateway_response_message' # جستجو در پیام پاسخ درگاه (اگر این فیلد را به Notification اضافه کرده‌اید)
    ]

    # فیلدهایی که می‌توان بر اساس آن‌ها مرتب‌سازی کرد
    ordering_fields = ['created_at', 'sent_at', 'status', 'user__username', 'order__id']
    ordering = ['-created_at'] # مرتب‌سازی پیش‌فرض بر اساس جدیدترین‌ها

    def get_queryset(self):
        """
        به‌طور پیش‌فرض فقط اعلان‌های از نوع SMS را برمی‌گرداند.
        شما می‌توانید این را بر اساس نیاز تغییر دهید یا یک فیلتر برای type در فرانت‌اند بگذارید.
        """
        # اگر NotificationTypeChoices در مدل Notification تعریف شده:
        # return Notification.objects.filter(type=Notification.NotificationTypeChoices.SMS).select_related('user', 'order').order_by('-created_at')
        # یا اگر به صورت رشته‌ای است:
        return Notification.objects.filter(type='SMS').select_related('user', 'order').order_by('-created_at')

class AdminSmsStatsView(APIView):
    """
    API endpoint to retrieve SMS delivery statistics.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, *args, **kwargs):
        # شما می‌توانید در آینده فیلترها را از query params بگیرید
        # queryset = NotificationLog.objects.filter(...) 

        queryset = Notification.objects.all()

        stats = queryset.aggregate(
            total=Count('id'),
            successful=Count('id', filter=Q(status=Notification.NotificationStatusChoices.SENT)),
            failed=Count('id', filter=Q(status=Notification.NotificationStatusChoices.FAILED)),
            pending=Count('id', filter=Q(status=Notification.NotificationStatusChoices.PENDING))
        )
        
        return Response(stats, status=status.HTTP_200_OK)
    
class SmsCreditBalanceView(APIView):
    """
    API endpoint to fetch the current SMS credit balance.
    This version uses caching to avoid frequent external API calls.
    """
    permission_classes = [permissions.IsAdminUser]

    # یک نام منحصر به فرد برای کلید کش تعریف می‌کنیم
    CACHE_KEY = "sms_credit_balance"
    # مدت زمان اعتبار کش به ثانیه (اینجا: ۱۰ دقیقه)
    CACHE_TIMEOUT = 60 * 10 

    def get(self, request, *args, **kwargs):
        # --- ۲. ابتدا تلاش می‌کنیم داده را از کش بخوانیم ---
        cached_credit = cache.get(self.CACHE_KEY)
        if cached_credit is not None:
            print("DEBUG: Credit fetched from CACHE.")
            return Response({'credit': cached_credit}, status=status.HTTP_200_OK)
        
        print("DEBUG: Cache miss. Fetching credit from external API.")
        
        # --- ۳. اگر در کش نبود، به سراغ API خارجی می‌رویم ---
        api_key = getattr(settings, 'SMS_IR_API_KEY_PRODUCTION', None)
        if not api_key:
            return Response({"error": "کلید API پنل پیامک تعریف نشده است."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        api_url = 'https://api.sms.ir/v1/credit'
        headers = {'X-API-KEY': api_key}
        
        try:
            response = requests.get(api_url, headers=headers, timeout=10)
            response.raise_for_status()
            data = response.json()

            credit = None
            if isinstance(data, dict) and data.get('status') == 1:
                credit = data.get('data')
            
            if isinstance(credit, (int, float)):
                # --- ۴. پس از دریافت موفق، نتیجه را در کش ذخیره می‌کنیم ---
                print(f"DEBUG: Setting cache for {self.CACHE_TIMEOUT} seconds.")
                cache.set(self.CACHE_KEY, credit, self.CACHE_TIMEOUT)
                return Response({'credit': credit}, status=status.HTTP_200_OK)
            else:
                return Response({"error": f"پاسخ دریافتی از پنل پیامک نامعتبر است: {data}"}, status=status.HTTP_400_BAD_REQUEST)

        except requests.exceptions.RequestException as e:
            return Response({"error": f"خطا در ارتباط با سرور پیامک: {e}"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except ValueError:
             return Response({"error": "پاسخ دریافتی از سرور پیامک فرمت JSON معتبر ندارد."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)   
def zarinpal_payment_callback(request):
    """
    این ویو توسط زرین‌پال بعد از اتمام عملیات پرداخت فراخوانی می‌شود.
    پرداخت را با زرین‌پال وریفای کرده و وضعیت تراکنش/سفارش را آپدیت می‌کند.
    """
    
    print("--- Zarinpal Payment Callback Received ---")
    authority = request.GET.get('Authority')
    status = request.GET.get('Status') # 'OK' or 'NOK'
    print(f"Callback Status: {status}, Authority: {authority}")

    # 1. بررسی وجود پارامترهای لازم
    if not authority or not status:
        print("Callback ERROR: Missing Authority or Status parameter.")
        
        print(f"Redirecting to frontend failure URL: {failure_url}")
        return redirect(failure_url)

    # 2. پیدا کردن تراکنش منتظر تایید با استفاده از Authority
    try:
        # تراکنشی را پیدا کن که این Authority برایش ثبت شده و هنوز منتظر تایید است
        transaction = get_object_or_404(
            Transaction,
            gateway_reference_id=authority, # فیلدی که Authority در آن ذخیره شده
            status=Transaction.TransactionStatusChoices.PENDING # وضعیت منتظر تایید
        )
        order = transaction.order # سفارش مرتبط با تراکنش
        final_failure_url = f"{failure_url}?orderId={order.id}"
        amount_rial = int(transaction.amount) # مبلغ تراکنش (که باید به ریال ذخیره شده باشد)
        print(f"Found pending Transaction ID: {transaction.id} for Order ID: {order.id} with amount (Rial): {amount_rial}")

    except Http404:
        print(f"Callback ERROR: No pending transaction found for Authority: {authority}. Checking if already SUCCESS...")
        # ممکن است کاربر صفحه را رفرش کرده یا Authority نامعتبر باشد
        # بررسی کنید آیا تراکنش با این Authority قبلا موفق شده؟
        if Transaction.objects.filter(gateway_reference_id=authority, status=Transaction.TransactionStatusChoices.SUCCESS).exists():
             print("Transaction already verified and completed.")
             # اگر قبلا موفق شده، به صفحه موفقیت هدایت کن
             success_url = f"{frontend_base_url}/payment/success?orderId={order.id}"
             print(f"Redirecting to frontend success URL: {success_url}")
             return redirect(success_url)
        else:
             return redirect(final_failure_url)
    except Exception as e:
        # خطای پیش‌بینی نشده در یافتن تراکنش
        print(f"CRITICAL ERROR finding transaction for Authority {authority}: {e}")
        traceback.print_exc()
        return redirect(final_failure_url)


    # 3. بررسی وضعیت بازگشتی از درگاه ('OK' or 'NOK')
    if status == 'OK':
        print("Callback status is OK. Proceeding with verification API call...")

        # 4. آماده‌سازی برای فراخوانی API وریفای زرین‌پال
        merchant_id = os.environ.get('ZARINPAL_MERCHANT_ID') # یا settings.ZARINPAL_MERCHANT_ID
        # !!! مطمئن شوید ZARINPAL_VERIFY_URL در settings.py تعریف شده (برای سندباکس و اصلی) !!!
        verify_url = getattr(settings, 'ZARINPAL_VERIFY_URL', None)

        if not merchant_id or not verify_url:
             print("CRITICAL ERROR: Zarinpal Merchant ID or Verify URL not configured in settings.")
             # تراکنش و سفارش را ناموفق کن چون نمی‌توان وریفای کرد
             transaction.status = Transaction.TransactionStatusChoices.FAILED
             transaction.gateway_response = "Configuration Error: Cannot verify."
             transaction.save()
             order.status = Order.OrderStatusChoices.PAYMENT_FAILED # وضعیت مناسب برای سفارش
             order.save()
             return redirect(final_failure_url)

        verify_payload = {
            "merchant_id": merchant_id,
            "amount": amount_rial, # مبلغ به ریال از تراکنش خوانده شد
            "authority": authority,
        }
        headers = {'content-type': 'application/json'}
        print(f"Sending verification request to {verify_url} with payload: {verify_payload}")

        # 5. فراخوانی API وریفای زرین‌پال
        try:
            response = requests.post(verify_url, data=json.dumps(verify_payload), headers=headers, timeout=15) # timeout مناسب
            response.raise_for_status() # بررسی خطاهای HTTP مثل 4xx/5xx
            res_json = response.json() # پاسخ را به صورت دیکشنری بخوان
            res_data = res_json.get('data', {})
            res_errors = res_json.get('errors', [])
            print(f"Verification response received: data={res_data}, errors={res_errors}")

            # 6. پردازش پاسخ وریفای
            # کد ۱۰۰ معمولا موفقیت است، کد ۱۰۱ یعنی قبلا وریفای شده
            verification_code = res_data.get('code') if isinstance(res_data, dict) else None

            if verification_code == 100:
                # ==== پرداخت با موفقیت تایید شد ====
                ref_id = res_data.get('ref_id')
                card_pan = res_data.get('card_pan', 'N/A') # شماره کارت (ماسک شده)
                print(f"Verification SUCCESS! Ref ID: {ref_id}, Card PAN: {card_pan}")

                transaction.status = Transaction.TransactionStatusChoices.SUCCESS
                transaction.ref_id = ref_id # ذخیره کد رهگیری نهایی
                transaction.gateway_response = json.dumps(res_data) # ذخیره پاسخ کامل موفقیت
                transaction.save()

                order.change_status(
                new_status=Order.OrderStatusChoices.PROCESSING,
                 notes="پرداخت با موفقیت توسط درگاه تایید شد."
                )
                print(f"Transaction {transaction.id} and Order {order.id} updated successfully.")
                success_url = f"{frontend_base_url}/payment/success?orderId={order.id}"
                # TODO: کاربر را به صفحه پرداخت موفق هدایت کنید
                return redirect(success_url)

            elif verification_code == 101:
                 # ==== پرداخت قبلاً تایید شده بود ====
                 ref_id = res_data.get('ref_id', transaction.ref_id)
                 print(f"Verification WARNING: Payment already verified (Code 101). Ref ID: {ref_id}")
                 # اطمینان از صحت وضعیت‌ها
                 if transaction.status != Transaction.TransactionStatusChoices.SUCCESS:
                    transaction.status = Transaction.TransactionStatusChoices.SUCCESS
                    transaction.ref_id = ref_id
                    transaction.gateway_response = json.dumps(res_data)
                    transaction.save()
                    order.change_status(
                    new_status=Order.OrderStatusChoices.PROCESSING,
                    notes="پرداخت قبلاً تایید شده بود، وضعیت سفارش همگام‌سازی شد."
                )
                 # TODO: کاربر را به صفحه پرداخت موفق هدایت کنید
                 success_url = f"{frontend_base_url}/payment/success?orderId={order.id}"
                 return redirect(success_url)

            else:
                 # ==== تایید پرداخت ناموفق بود ====
                 error_code = verification_code if verification_code else (res_errors.get('code') if isinstance(res_errors, dict) else 'N/A')
                 error_message = res_data.get('message') if isinstance(res_data, dict) else (res_errors.get('message') if isinstance(res_errors, dict) else 'Verification Failed')
                 print(f"Verification FAILED! Code: {error_code}, Message: {error_message}, Errors: {res_errors}")

                 transaction.status = Transaction.TransactionStatusChoices.FAILED
                 transaction.gateway_response = json.dumps(res_json) # ذخیره پاسخ کامل خطا
                 transaction.save()

                 order.change_status(
                new_status=Order.OrderStatusChoices.PAYMENT_FAILED,
                notes=f"تایید پرداخت ناموفق بود: {error_message}"
            )
                 print(f"Transaction {transaction.id} and Order {order.id} marked as failed.")
                 # TODO: کاربر را به صفحه پرداخت ناموفق هدایت کنید
                 return redirect(final_failure_url)

        except (requests.exceptions.Timeout, requests.exceptions.RequestException, json.JSONDecodeError) as e:
        # ==== مدیریت تمام خطاهای ارتباطی و ساختاری در یک بلاک ====
            error_note = "خطای پیش‌بینی نشده در ارتباط با درگاه پرداخت."
            if isinstance(e, requests.exceptions.Timeout):
                error_note = "خطای Timeout در ارتباط با درگاه پرداخت."
            elif isinstance(e, requests.exceptions.RequestException):
                error_note = f"خطای شبکه در ارتباط با درگاه پرداخت: {e}"
            elif isinstance(e, json.JSONDecodeError):
                error_note = "پاسخ دریافتی از درگاه پرداخت معتبر نبود."
            
            print(f"Verification ERROR: {error_note}")
            
            transaction.status = Transaction.TransactionStatusChoices.FAILED
            transaction.gateway_response = error_note
            transaction.save()
            
            order.change_status(
                new_status=Order.OrderStatusChoices.PAYMENT_FAILED,
                notes=error_note
            )
            return redirect(final_failure_url)

    else: # status == 'NOK' یا وضعیت نامعتبر دیگر
        # ==== پرداخت توسط کاربر لغو شده یا در درگاه ناموفق بوده ====
        print(f"Callback status is '{status}'. Payment failed or cancelled by user.")
        transaction.status = Transaction.TransactionStatusChoices.FAILED
        transaction.gateway_response = f"Callback Status: {status}"
        transaction.save()
        order.change_status(
        new_status=Order.OrderStatusChoices.PAYMENT_FAILED,
        notes=f"پرداخت توسط کاربر لغو شد یا در درگاه ناموفق بود. وضعیت بازگشتی: {status}"
    )
        print(f"Transaction {transaction.id} and Order {order.id} marked as failed due to callback status.")
        # TODO: کاربر را به صفحه پرداخت ناموفق هدایت کنید
        return redirect(final_failure_url)

class CartItemViewSet(mixins.UpdateModelMixin, # برای PATCH (partial_update)
                      mixins.DestroyModelMixin, # برای DELETE (destroy)
                      viewsets.GenericViewSet):
    """
    Handles updating quantity (PATCH) and deleting (DELETE)
    items within the user's active cart.
    Accessible via /api/v1/cart/items/{item_pk}/
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = OrderItem.objects.all() # کوئری ست پایه

    # برای آپدیت (PATCH) از سریالایزر آپدیت تعداد استفاده می‌کنیم
    # برای پاسخ آپدیت یا نمایش (اگر لازم بود) می‌توان از OrderItemReadSerializer استفاده کرد
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return CartItemUpdateSerializer
        return OrderItemReadSerializer # یا سریالایزر پیش‌فرض دیگر

    def get_object(self):
        """
        آیتم سفارش را فقط در صورتی برمی‌گرداند که متعلق به
        سبد خرید (وضعیت CART) کاربر فعلی باشد.
        """
        # گرفتن pk آیتم از URL
        item_pk = self.kwargs.get('pk')
        user = self.request.user

        try:
            # پیدا کردن آیتم بر اساس pk، کاربر سفارش والد و وضعیت سفارش والد
            order_item = get_object_or_404(
                OrderItem,
                pk=item_pk,
                order__user=user, # آیتم باید متعلق به سفارش کاربر باشد
                order__status=Order.OrderStatusChoices.CART # سفارش باید سبد خرید باشد
            )
            # self.check_object_permissions(self.request, order_item) # اگر permission object-level دارید
            return order_item
        except Http404:
            # اگر پیدا نشد یا شرایط برقرار نبود، 404 برگردان
            raise Http404("No matching item found in your active cart.")

    def perform_update(self, serializer):
        """
        بعد از آپدیت تعداد آیتم، قیمت کل سبد خرید را دوباره محاسبه می‌کند.
        """
        order_item = serializer.save() # آپدیت را انجام بده و آیتم آپدیت شده را بگیر
        # قیمت کل سفارش والد را آپدیت کن
        if hasattr(order_item.order, 'update_total_price'):
            print(f"Updating total price for cart (Order ID: {order_item.order.id}) after updating item {order_item.id}")
            order_item.order.update_total_price()
        else:
             print(f"Warning: Cannot update order total price after item update (method missing).")


    def perform_destroy(self, instance):
        """
        بعد از حذف آیتم، قیمت کل سبد خرید را دوباره محاسبه می‌کند.
        """
        order = instance.order # سفارش والد را قبل از حذف نگه دار
        print(f"Deleting item {instance.id} from cart (Order ID: {order.id})")
        instance.delete() # آیتم را حذف کن
        # قیمت کل سفارش والد را آپدیت کن
        if hasattr(order, 'update_total_price'):
             print(f"Updating total price for cart (Order ID: {order.id}) after deleting item")
             order.update_total_price()
        else:
             print(f"Warning: Cannot update order total price after item deletion (method missing).")
