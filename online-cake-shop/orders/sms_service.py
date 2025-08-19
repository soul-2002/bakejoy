# core/sms_service.py (یا orders/sms_service.py)
import requests
from django.conf import settings
from django.utils import timezone # برای sent_at
import json
import time
from string import Template # برای جایگزینی ساده متغیرها

# مسیر مدل‌های خود را بر اساس ساختار پروژه تنظیم کنید
# from notifications.models import SMSTemplate, Notification # اگر در اپلیکیشن notifications هستند
# from orders.models import Order # اگر مدل Order در اپلیکیشن orders است
# فرض می‌کنم این مدل‌ها در همان اپلیکیشن sms_service.py یا قابل دسترس هستند:
from .models import SMSTemplate, Notification, Order # این ایمپورت‌ها را متناسب با پروژه خود تنظیم کنید

def format_sms_message(template_string: str, order: Order) -> str:
    """
    متغیرهای داخل قالب پیامک را با اطلاعات سفارش جایگزین می‌کند.
    """
    customer_name = "مشتری گرامی"
    if order.user:
        customer_name = order.user.get_full_name() or order.user.username

    # اطمینان از اینکه مقادیر None به رشته خالی تبدیل می‌شوند تا در replace مشکلی ایجاد نشود
    tracking_number_str = str(order.tracking_code) if order.tracking_code else "ثبت نشده"
    order_id_str = str(order.id)
    order_total_str = str(int(order.total_price)) if order.total_price is not None else "0" # یا فرمت دلخواه شما

    # استفاده از دیکشنری برای خوانایی بیشتر
    mapping = {
        'customer_name': customer_name,
        'order_id': order_id_str,
        'order_total': order_total_str,
        'store_name': settings.SITE_NAME if hasattr(settings, 'SITE_NAME') else 'فروشگاه شما', # SITE_NAME را در settings.py تعریف کنید
        'tracking_number': tracking_number_str,
        # می‌توانید متغیرهای بیشتری مانند تاریخ سفارش، لینک مشاهده سفارش و ... اضافه کنید
    }
    
    message = template_string
    for key, value in mapping.items():
        message = message.replace(f"{{{{{key}}}}}", value) # مثال: {{customer_name}}
    return message


def send_order_status_sms(order: Order, event_trigger_key: str):
    print(f"--- DEBUG: send_order_status_sms function entered for event: '{event_trigger_key}' ---")
    """
    بر اساس رویداد/وضعیت سفارش، قالب پیامک مناسب را پیدا کرده،
    آن را با اطلاعات سفارش فرمت کرده، از طریق sms.ir ارسال می‌کند
    و نتیجه را در مدل Notification لاگ می‌کند.
    """
    try:
        sms_template = SMSTemplate.objects.get(event_trigger=event_trigger_key, is_active=True)
        print(f"--- DEBUG: Found active template: '{sms_template.description}' ---")
    except SMSTemplate.DoesNotExist:
        print(f"--- ERROR: No active SMS template found for event '{event_trigger_key}'. Aborting. ---")
        return False, "No active template for this event.", None
    except SMSTemplate.MultipleObjectsReturned: # اگر به اشتباه چند قالب فعال برای یک رویداد داشتید
        print(f"SMS Service: Multiple active SMS templates found for event_trigger '{event_trigger_key}'. Using the first one.")
        sms_template = SMSTemplate.objects.filter(event_trigger=event_trigger_key, is_active=True).first()
        if not sms_template: # این حالت نباید اتفاق بیفتد اگر MultipleObjectsReturned رخ داده
             return False, "Error finding template after multiple objects returned.", None


    final_message_body = format_sms_message(sms_template.message_template, order)
    
    recipient_number = None
    recipient_user = order.user # کاربر مرتبط با سفارش

    # فقط از فیلد phone در مدل CustomUser استفاده می‌کنیم
    if recipient_user and hasattr(recipient_user, 'phone') and recipient_user.phone:
        recipient_number = str(recipient_user.phone)
        print(f"SMS Service: Using phone from user profile: {recipient_number} for Order ID {order.id}")

    if not recipient_number:
        print(f"SMS Service: No recipient phone number found for Order ID {order.id}. SMS not sent.")
        # ایجاد لاگ ناموفق بدون ارسال به درگاه
        Notification.objects.create(
            user=order.user,
            order=order,
            message=final_message_body, # متن آماده شده
            type=Notification.NotificationTypeChoices.SMS,
            status=Notification.NotificationStatusChoices.FAILED,
            gateway_response_message="شماره تلفن گیرنده موجود نیست."
        )
        return False, "Recipient phone number missing.", None

    # -- انتخاب کلید API و URL پایه --
    if settings.USE_SMS_IR_SANDBOX:
        current_api_key = settings.SMS_IR_API_KEY_SANDBOX
        env_mode = "Sandbox"
    else:
        current_api_key = settings.SMS_IR_API_KEY_PRODUCTION
        env_mode = "Production"
    current_base_url = settings.SMS_IR_API_BASE_URL
    # -- پایان انتخاب کلید --

    # -- بررسی تنظیمات --
    if not current_api_key or not settings.SMS_IR_LINE_NUMBER or not current_base_url:
        error_msg = f"تنظیمات API ({env_mode}) برای sms.ir ناقص است (کلید، شماره خط یا URL پایه)."
        print(f"SMS Service Error: {error_msg}")
        Notification.objects.create(user=order.user, order=order, message=final_message_body, type=Notification.NotificationTypeChoices.SMS, status=Notification.NotificationStatusChoices.FAILED, gateway_response_message=error_msg)
        return False, error_msg, None
    # -- پایان بررسی --
    
    api_url = f"{current_base_url.rstrip('/')}/send/bulk"
    payload = {
        "lineNumber": str(settings.SMS_IR_LINE_NUMBER),
        "messageText": final_message_body,
        "mobiles": [recipient_number.lstrip('0')], # یا فرمت مورد نیاز sms.ir
    }
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-KEY': current_api_key
    }

    print(f"SMS Service ({env_mode}): Attempting to send SMS for Order ID {order.id} to {recipient_number} for event {event_trigger_key}")
    print(f"SMS Service ({env_mode}): Payload: {json.dumps(payload)}")

    notification_status = Notification.NotificationStatusChoices.PENDING
    gateway_status_code = None
    gateway_message = None
    gateway_data = None
    sent_timestamp = None

    try:
        response = requests.post(api_url, data=json.dumps(payload), headers=headers, timeout=15)
        response.raise_for_status()
        response_data = response.json()
        print(f"SMS Service ({env_mode}): API Full Response: {response_data}")

        gateway_status_code = str(response_data.get("status"))
        gateway_message = str(response_data.get("message", ""))
        gateway_data = response_data.get("data") # این می‌تواند شامل PackId, MessageIds, Cost باشد

        if gateway_status_code == '1': # یا هر کد موفقیت دیگری از sms.ir
            notification_status = Notification.NotificationStatusChoices.SENT
            sent_timestamp = timezone.now()
            success_flag = True
        else:
            notification_status = Notification.NotificationStatusChoices.FAILED
            success_flag = False

    except requests.exceptions.HTTPError as http_err:
        notification_status = Notification.NotificationStatusChoices.FAILED
        gateway_message = f"HTTP error: {http_err.response.status_code if http_err.response else 'N/A'}"
        if http_err.response is not None:
            try: gateway_message += f" - Detail: {str(http_err.response.json())}"
            except ValueError: gateway_message += f" - Detail: {http_err.response.text}"
        print(f"SMS Service ({env_mode}): HTTP error occurred: {gateway_message}")
        success_flag = False
    except requests.exceptions.RequestException as req_err:
        notification_status = Notification.NotificationStatusChoices.FAILED
        gateway_message = f"Request exception: {req_err}"
        print(f"SMS Service ({env_mode}): Request exception occurred: {gateway_message}")
        success_flag = False
    except Exception as e:
        notification_status = Notification.NotificationStatusChoices.FAILED
        gateway_message = f"An unexpected error: {e}"
        print(f"SMS Service ({env_mode}): An unexpected error occurred: {gateway_message}")
        success_flag = False

    # ایجاد رکورد لاگ در Notification
    Notification.objects.create(
        user=order.user,
        order=order,
        message=final_message_body,
        type=Notification.NotificationTypeChoices.SMS,
        status=notification_status,
        sent_at=sent_timestamp,
        gateway_response_status_code=gateway_status_code,
        gateway_response_message=gateway_message,
        # این فیلدها را به مدل Notification اضافه کنید
        # gateway_pack_id=gateway_data.get('PackId') if gateway_data else None,
        # gateway_message_ids=gateway_data.get('MessageIds') if gateway_data else None,
        # cost=gateway_data.get('Cost') if gateway_data else None,
    )
    
    return success_flag, gateway_message, gateway_data