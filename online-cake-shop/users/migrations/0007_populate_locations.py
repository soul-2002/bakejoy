from django.db import migrations
import json
import os

def populate_locations_from_new_format(apps, schema_editor):
    """
    اطلاعات استان‌ها و شهرها را از فایل JSON با فرمت جدید می‌خواند
    و در دیتابیس ذخیره می‌کند.
    """
    Province = apps.get_model('users', 'Province')
    City = apps.get_model('users', 'City')

    # مسیر فایل JSON شما
    json_file_path = os.path.join(os.path.dirname(__file__), '..', '..', 'list.json')

    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

        for item in data:
            # ما فقط به آبجکت‌هایی کار داریم که "کد شهرستان" دارند،
            # چون آنها هم اطلاعات شهر و هم استان مربوطه را شامل می‌شوند.
            if "کد شهرستان" in item:
                province_name = item.get("نام استان")
                city_name = item.get("نام شهرستان")

                # مطمئن می‌شویم که نام استان و شهر وجود دارند
                if province_name and city_name:
                    # ابتدا استان را پیدا یا ایجاد می‌کنیم
                    # متد get_or_create از ایجاد استان تکراری جلوگیری می‌کند
                    province_obj, created = Province.objects.get_or_create(
                        name=province_name.strip()
                    )
                    
                    # سپس شهر را ساخته و به استان مربوطه متصل می‌کنیم
                    City.objects.get_or_create(
                        name=city_name.strip(), 
                        province=province_obj
                    )

class Migration(migrations.Migration):

    dependencies = [
        # نام فایل مایگریشن قبلی خود را اینجا قرار دهید
        ('users', '0006_address_recipient_name'), 
    ]

    operations = [
        migrations.RunPython(populate_locations_from_new_format),
    ]