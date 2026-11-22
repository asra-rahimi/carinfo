from django.core.management.base import BaseCommand
from django.utils.text import slugify

from parts.models import Category, Part
from guides.models import Glossary, Guide
from warning_lights.models import OBDCode, WarningLight
from quiz.models import QuizQuestion

WIKI = 'https://commons.wikimedia.org/wiki/Special:FilePath/{name}?width=1000'

CATEGORIES = [
    ('موتور و احتراق', 'motor'),
    ('برق و شارژ', 'electrical'),
    ('خنک‌کننده', 'cooling'),
    ('ترمز و تعلیق', 'brake-suspension'),
]

PARTS = [
    dict(
        slug='engine-block',
        name='بلوک موتور و پیستون‌ها',
        en_name='Engine Block & Pistons',
        category='موتور و احتراق',
        location='محفظه جلویی خودرو',
        lifespan='۱۵۰k تا ۲۵۰k کیلومتر',
        image_url=WIKI.format(name='Piston.jpg'),
        short_description='تبدیل انرژی حرارتی احتراق به حرکت رفت‌وبرگشتی پیستون و چرخش میل‌لنگ.',
        description='بلوک موتور اسکلت اصلی پیشرانه است و سیلندرها، مسیرهای آب خنک‌کننده و روغن را در خود جای می‌دهد. پیستون‌ها با فشار گازهای مشتعل حرکت کرده و گشتاور تولید می‌کنند.',
        function='اسکلت اصلی پیشرانه است که سیلندرها، مسیرهای آب و روغن را در خود جای می‌دهد و نیروی احتراق را به حرکت مکانیکی تبدیل می‌کند.',
        failure_signs='دود آبی یا سفید از اگزوز\nکاهش کمپرس و افت شتاب\nصدای کوبش مکانیکی یا روغن‌سوزی',
        maintenance_tips='تعویض به‌موقع روغن موتور با گرید توصیه‌شده\nکنترل سطح مایع خنک‌کننده در فواصل منظم\nبررسی دوره‌ای واشر سرسیلندر و سیستم خنک‌کاری',
    ),
    dict(
        slug='alternator',
        name='دینام و سیستم شارژ',
        en_name='Alternator',
        category='برق و شارژ',
        location='کنار موتور با تسمه محرک',
        lifespan='۱۰۰k تا ۱۵۰k کیلومتر',
        image_url=WIKI.format(name='Alternator.jpg'),
        short_description='تولید جریان برق در زمان روشن بودن موتور و شارژ مداوم باتری.',
        description='دینام با دریافت نیروی چرخشی از تسمه، جریان متناوب تولید کرده و پس از یکسوسازی، برق لازم ECU، چراغ‌ها و شارژ باتری را تامین می‌کند.',
        function='تولید برق موردنیاز خودرو هنگام کار موتور و شارژ نگه‌داشتن باتری.',
        failure_signs='روشن ماندن چراغ باتری در پشت آمپر\nدشارژ شدن مداوم باتری\nصدای زوزه یا بلبرینگ از جلوی موتور',
        maintenance_tips='بررسی کشش و ترک‌خوردگی تسمه دینام\nتمیز نگه‌داشتن قطب‌های باتری از سولفاته شدن\nتست ولتاژ شارژ در سرویس‌های دوره‌ای',
    ),
    dict(
        slug='radiator',
        name='رادیاتور و سیستم خنک‌کننده',
        en_name='Radiator & Cooling System',
        category='خنک‌کننده',
        location='جلوپنجره خودرو',
        lifespan='۸۰k تا ۱۲۰k کیلومتر',
        image_url=WIKI.format(name='Automobile_radiator.jpg'),
        short_description='دفع حرارت اضافه موتور از طریق تبادل گرما با جریان هوا.',
        description='مایع خنک‌کننده گرم پس از عبور از مجاری موتور وارد لوله‌های ظریف رادیاتور شده و گرمای خود را به هوای عبوری منتقل می‌کند.',
        function='دفع گرمای اضافی موتور با انتقال حرارت مایع خنک‌کننده به جریان هوا.',
        failure_signs='بالا رفتن دمای آب و جوش آوردن\nنشتی مایع خنک‌کننده زیر خودرو\nگرفتگی پره‌ها یا رسوب داخلی',
        maintenance_tips='بررسی سطح و رنگ مایع خنک‌کننده هر ماه\nشست‌وشوی پره‌های رادیاتور از آلودگی\nتعویض ضدیخ استاندارد طبق برنامه سازنده',
    ),
    dict(
        slug='brake-disc',
        name='دیسک و لنت ترمز',
        en_name='Brake Disc & Pads',
        category='ترمز و تعلیق',
        location='پشت رینگ چرخ‌ها',
        lifespan='۲۵k تا ۵۰k کیلومتر',
        image_url=WIKI.format(name='Automobile_brake_pad.jpg'),
        short_description='ایجاد اصطکاک کنترل‌شده برای کاهش سرعت و توقف ایمن خودرو.',
        description='با فشردن پدال ترمز، فشار هیدرولیکی پیستون کالیپر را حرکت داده و لنت‌ها را به دیسک دوار می‌چسباند تا انرژی جنبشی به گرما تبدیل شود.',
        function='تبدیل انرژی جنبشی خودرو به گرما از طریق اصطکاک لنت با دیسک برای توقف ایمن.',
        failure_signs='صدای سوت یا سایش فلزی هنگام ترمز\nلرزش پدال یا فرمان در ترمزگیری\nافزایش مسافت توقف خودرو',
        maintenance_tips='بررسی ضخامت لنت هر ۱۰ هزار کیلومتر\nبررسی سطح روغن ترمز و عدم وجود هوا در مدار\nتعویض دیسک در صورت شیار یا تاب برداشتن',
    ),
    dict(
        slug='suspension',
        name='کمک‌فنر و سیستم تعلیق',
        en_name='Shock Absorber & Suspension',
        category='ترمز و تعلیق',
        location='اتصال چرخ‌ها به شاسی',
        lifespan='۶۰k تا ۸۰k کیلومتر',
        image_url=WIKI.format(name='Close-up_of_a_car_mechanic_holding_a_shock_absorber.jpg'),
        short_description='جذب ضربات ناهمواری جاده و حفظ تماس پیوسته لاستیک با سطح مسیر.',
        description='کمک‌فنر نوسانات فنر لول را میرا کرده و از جهش بیش از حد اتاق خودرو در دست‌اندازها و پیچ‌ها جلوگیری می‌کند.',
        function='میرا کردن نوسانات فنر و حفظ تماس پیوسته چرخ با سطح جاده.',
        failure_signs='کوبش در دست‌اندازها\nروغن‌زدگی روی بدنه کمک‌فنر\nشیرجه زدن جلوی خودرو هنگام ترمز',
        maintenance_tips='بررسی چشمی نشتی روغن کمک‌فنرها\nتست فنربندی در مراکز معاینه فنی\nتعویض جفتی کمک‌فنرهای یک محور',
    ),
    dict(
        slug='battery',
        name='باتری خودرو',
        en_name='Automotive Battery',
        category='برق و شارژ',
        location='محفظه موتور',
        lifespan='۲ تا ۳ سال',
        image_url=WIKI.format(name='Photo-CarBattery.jpg'),
        short_description='ذخیره انرژی الکتریکی و تامین جریان بالا برای استارت زدن موتور.',
        description='باتری ۱۲ ولتی انرژی شیمیایی را ذخیره کرده و در زمان استارت، جریان استارت‌موتور و تغذیه مدارهای کنترلی را فراهم می‌سازد.',
        function='ذخیره انرژی الکتریکی و تامین جریان بالای استارت برای روشن شدن موتور.',
        failure_signs='ضعیف شدن یا تک‌استارت نخوردن\nسولفاته شدن قطب‌ها\nکم‌نور شدن چراغ‌ها در حالت درجا',
        maintenance_tips='بررسی ولتاژ باتری در حالت خاموش و روشن\nتمیز کردن قطب‌ها و محکم بودن اتصالات\nعدم استفاده طولانی از تجهیزات برقی با موتور خاموش',
    ),
    dict(
        slug='ecu',
        name='واحد کنترل الکترونیکی (ECU)',
        en_name='Engine Control Unit (ECU)',
        category='برق و شارژ',
        location='محفظه موتور یا کابین زیر داشبورد',
        lifespan='طولانی‌مدت (در صورت عدم نفوذ آب یا اتصال کوتاه)',
        image_url=WIKI.format(name='Electronic_control_unit.jpg'),
        short_description='پردازش سیگنال سنسورها و تنظیم دقیق زمان پاشش سوخت، جرقه‌زنی و دور موتور.',
        description='ECU با دریافت داده‌های سنسور اکسیژن، دمای آب، دریچه گاز و دور موتور، نسبت سوخت به هوا و زاویه جرقه را در میلی‌ثانیه بهینه می‌کند.',
        function='مغز الکترونیکی موتور که داده‌های سنسورها را پردازش و عملگرها را فرمان می‌دهد.',
        failure_signs='روشن شدن چراغ چک و ثبت کد خطا\nبد روشن شدن یا خاموشی ناگهانی موتور\nافزایش مصرف سوخت یا ریپ زدن',
        maintenance_tips='محافظت از ECU در برابر نفوذ آب هنگام شست‌وشوی موتور\nبررسی دوره‌ای کدهای خطا با دیاگ\nعدم دستکاری سیم‌کشی برق خودرو',
    ),
    dict(
        slug='catalytic',
        name='کاتالیزور اگزوز',
        en_name='Catalytic Converter',
        category='موتور و احتراق',
        location='مسیر لوله اگزوز زیر خودرو',
        lifespan='۸۰k تا ۱۲۰k کیلومتر',
        image_url=WIKI.format(name='Catalytic_Converter.JPG'),
        short_description='کاهش گازهای آلاینده خروجی از موتور پیش از تخلیه به محیط.',
        description='کاتالیزور با استفاده از پوشش کاتالیزوری روی شبکه سرامیکی یا فلزی، واکنش‌های اکسیداسیون و احیا را برای کاهش آلاینده‌ها انجام می‌دهد.',
        function='پالایش گازهای خروجی اگزوز و کاهش آلاینده‌های مضر پیش از تخلیه به محیط.',
        failure_signs='کاهش کشش و خفگی موتور\nبوی نامطبوع اگزوز\nثبت خطای بازدهی کاتالیزور (مانند P0420)',
        maintenance_tips='بررسی نشتی مسیر اگزوز در سرویس‌های دوره‌ای\nرفع سریع احتراق ناقص برای جلوگیری از آسیب کاتالیزور\nاستفاده از سوخت استاندارد',
    ),
]

WARNING_LIGHTS = [
    dict(
        slug='oil',
        title='فشار روغن موتور (Oil Pressure)',
        severity='red',
        meaning='کاهش فشار روغن در مدار روانکاری موتور.',
        action='فوراً خودرو را در جای امن متوقف و موتور را خاموش کنید.',
    ),
    dict(
        slug='temp',
        title='دمای بالای مایع خنک‌کننده',
        severity='red',
        meaning='افزایش دمای موتور فراتر از حد مجاز.',
        action='در جای امن توقف کنید و از باز کردن درب رادیاتور داغ خودداری نمایید.',
    ),
    dict(
        slug='brake',
        title='سیستم ترمز و ترمز دستی',
        severity='red',
        meaning='کشیده بودن ترمز دستی یا افت سطح روغن ترمز.',
        action='ترمز دستی را آزاد کنید؛ در صورت روشن ماندن، ترمز را بررسی نمایید.',
    ),
    dict(
        slug='cel',
        title='چراغ چک موتور (Check Engine)',
        severity='yellow',
        meaning='ثبت خطا در سنسورها، احتراق یا سیستم سوخت‌رسانی.',
        action='با دستگاه دیاگ OBD-II کد خطا را بررسی کنید.',
    ),
    dict(
        slug='abs',
        title='سیستم ترمز ضدقفل (ABS)',
        severity='yellow',
        meaning='از مدار خارج شدن عملکرد ABS در ترمزگیری شدید.',
        action='ترمز معمولی فعال است؛ برای بررسی سنسور چرخ اقدام کنید.',
    ),
    dict(
        slug='tpms',
        title='فشار باد لاستیک‌ها (TPMS)',
        severity='yellow',
        meaning='کم بودن باد یک یا چند لاستیک.',
        action='باد لاستیک‌ها را در حالت سرد تنظیم کنید.',
    ),
]

OBD_CODES = [
    dict(
        code='P0300',
        title='احتراق ناقص تصادفی یا چندسیلندری',
        description='احتراق ناقص در چند سیلندر به صورت تصادفی تشخیص داده شده است.',
        possible_causes='شمع‌های فرسوده، کوئل‌های ضعیف، فشار سوخت نامناسب یا انژکتورهای کثیف.',
        recommended_action='شمع‌ها، کوئل‌ها، فشار سوخت یا انژکتورها را بررسی کنید.',
        severity='yellow',
    ),
    dict(
        code='P0420',
        title='کاهش بازدهی کاتالیزور',
        description='بازدهی کاتالیزور در محدوده مجاز سنسور اکسیژن پایین دست قرار ندارد.',
        possible_causes='آسیب کاتالیزور، خطای سنسور اکسیژن یا نشتی اگزوز.',
        recommended_action='وضعیت کاتالیزور، سنسورهای اکسیژن و نشتی اگزوز را چک نمایید.',
        severity='yellow',
    ),
    dict(
        code='P0171',
        title='مخلوط سوخت و هوای رقیق (Bank 1)',
        description='نسبت هوا به سوخت در بانک اول بیش از حد رقیق شده است.',
        possible_causes='نشتی هوا در مسیر مکش، خطای سنسور MAF یا فشار پایین پمپ بنزین.',
        recommended_action='نشتی هوا در مسیر مکش، سنسور MAF یا فشار پمپ بنزین را بررسی کنید.',
        severity='yellow',
    ),
    dict(
        code='P0115',
        title='ایراد مدار سنسور دمای مایع خنک‌کننده',
        description='سیگنال سنسور دمای مایع خنک‌کننده خارج از محدوده مجاز است.',
        possible_causes='خرابی سنسور دما، اتصالی سوکت یا سیم‌کشی مربوطه.',
        recommended_action='سنسور دمای آب و سوکت/سیم‌کشی مربوطه را بررسی کنید.',
        severity='yellow',
    ),
]

GLOSSARY = [
    ('ECU', 'Engine Control Unit', 'کامپیوتر مرکزی مدیریت موتور و زمان‌بندی سوخت و جرقه.', 'الکترونیک'),
    ('OBD-II', 'On-Board Diagnostics', 'استاندارد عیب‌یابی الکترونیکی و خواندن کدهای خطای خودرو.', 'الکترونیک'),
    ('Torque', 'گشتاور موتور', 'نیروی چرخشی تولیدی موتور که در شتاب‌گیری و سربالایی نقش کلیدی دارد.', 'پیشرانه'),
    ('ABS', 'Anti-lock Braking System', 'جلوگیری از قفل شدن چرخ‌ها هنگام ترمزگیری ناگهانی و حفظ کنترل فرمان.', 'ترمز'),
    ('RPM', 'Revolutions Per Minute', 'تعداد دور چرخش میل‌لنگ موتور در هر دقیقه.', 'پیشرانه'),
    ('Thermostat', 'ترموستات', 'تنظیم‌کننده گردش مایع خنک‌کننده برای حفظ دمای کاری بهینه موتور.', 'خنک‌کاری'),
]

QUIZ_QUESTIONS = [
    dict(
        part='ecu',
        question='کدام قطعه سیگنال سنسورها را پردازش کرده و زمان پاشش سوخت و جرقه را کنترل می‌کند؟',
        option_a='واحد کنترل الکترونیکی (ECU)',
        option_b='رادیاتور',
        option_c='کمک‌فنر',
        option_d='دیسک ترمز',
        correct_answer='A',
        explanation='ECU مغز الکترونیکی موتور است که داده‌های سنسورها را تحلیل و عملگرها را فرمان می‌دهد.',
    ),
    dict(
        part='radiator',
        question='وظیفه اصلی رادیاتور در سیستم خنک‌کننده چیست؟',
        option_a='دفع حرارت مایع خنک‌کننده به هوا',
        option_b='تولید برق برای باتری',
        option_c='افزایش فشار روغن ترمز',
        option_d='تصفیه دود اگزوز',
        correct_answer='A',
        explanation='رادیاتور گرمای جذب‌شده از موتور را از طریق پره‌ها به جریان هوا منتقل می‌کند.',
    ),
    dict(
        part='alternator',
        question='اگر چراغ باتری در پشت آمپر هنگام روشن بودن موتور روشن بماند، احتمالاً چه مشکلی وجود دارد؟',
        option_a='اختلال در دینام یا مدار شارژ',
        option_b='کم بودن باد لاستیک جلو',
        option_c='تمام شدن لنت عقب',
        option_d='گرفتگی فیلتر کابین',
        correct_answer='A',
        explanation='روشن ماندن نماد باتری هنگام کار موتور معمولاً نشانه عدم شارژ مناسب توسط دینام است.',
    ),
    dict(
        part='brake-disc',
        question='صدای سوت یا سایش فلزی هنگام ترمز گرفتن بیشتر به چه دلیلی رخ می‌دهد؟',
        option_a='فرسودگی لنت ترمز',
        option_b='خرابی ترموستات',
        option_c='نشتی مایع شیشه‌شوی',
        option_d='خرابی سنسور دور موتور',
        correct_answer='A',
        explanation='با کاهش ضخامت لنت تا حد مجاز، لنت یا نشانگر آن روی سطح دیسک اثر می‌گذارد.',
    ),
    dict(
        part='suspension',
        question='روغن‌زدگی روی بدنه کمک‌فنر نشانه چیست؟',
        option_a='نشتی روغن و کاهش میرایی ضربات',
        option_b='شارژ کامل باتری',
        option_c='تنظیم بودن باد تایرها',
        option_d='سلامت دیسک ترمز',
        correct_answer='A',
        explanation='خروج روغن هیدرولیک یا گاز از کاسه‌نمد کمک‌فنر باعث کاهش کنترل نوسانات فنر می‌شود.',
    ),
]

GUIDES = [
    dict(
        title='راهنمای تعویض روغن موتور',
        category='نگهداری دوره‌ای',
        image_url=WIKI.format(name='Motor_oil.jpg'),
        short_description='زمان مناسب، مراحل و نکات ایمنی تعویض روغن موتور خودرو.',
        content='''تعویض به‌موقع روغن موتور مهم‌ترین اقدام برای افزایش عمر پیشرانه است.\n\nروغن موتور وظیفه روانکاری، خنک‌کاری و پاکسازی قطعات متحرک را بر عهده دارد و با گذشت زمان خاصیت خود را از دست می‌دهد.\n\nزمان مناسب تعویض:\n- هر ۵ تا ۱۰ هزار کیلومتر بسته به نوع روغن و توصیه سازنده\n- هر ۶ تا ۱۲ ماه در صورت کارکرد کم\n\nمراحل تعویض:\n1. موتور را گرم کنید تا روغن راحت‌تر تخلیه شود.\n2. خودرو را روی سطح صاف قرار دهید و پیچ کارتل را باز کنید.\n3. فیلتر روغن را تعویض کنید.\n4. روغن جدید با گرید توصیه‌شده بریزید و سطح آن را با گیج کنترل کنید.\n\nنکته: روغن کارکرده را هرگز در محیط رها نکنید و به مراکز بازیافت تحویل دهید.''',
    ),
    dict(
        title='نگهداری باتری خودرو در فصل سرما',
        category='برق و شارژ',
        image_url=WIKI.format(name='Photo-CarBattery.jpg'),
        short_description='چگونه از باتری خودرو در هوای سرد محافظت کنیم و عمر آن را افزایش دهیم.',
        content='''هوای سرد بزرگ‌ترین دشمن باتری خودرو است؛ در دمای پایین، توان باتری برای تامین جریان استارت کاهش می‌یابد.\n\nراهکارهای محافظت از باتری در زمستان:\n- قطب‌ها و اتصالات را تمیز و محکم نگه دارید.\n- از روشن گذاشتن تجهیزات برقی با موتور خاموش خودداری کنید.\n- در سفرهای کوتاه و مکرر، هر چند روز یک بار مسیر طولانی‌تری برانید تا باتری کامل شارژ شود.\n- قبل از فصل سرما ولتاژ باتری را با دستگاه تست بررسی کنید.\n\nاگر استارت ضعیف شد، ابتدا اتصالات و سپس شارژ دینام را بررسی کنید.''',
    ),
    dict(
        title='بازرسی سیستم خنک‌کننده موتور',
        category='بازرسی فنی',
        image_url=WIKI.format(name='Automobile_radiator.jpg'),
        short_description='چک‌لیست ساده برای پیشگیری از جوش آوردن و آسیب موتور.',
        content='''سیستم خنک‌کننده وظیفه نگه‌داشتن موتور در دمای کاری مناسب را بر عهده دارد و خرابی آن می‌تواند آسیب‌های جدی و پرهزینه ایجاد کند.\n\nچک‌لیست ماهانه:\n- سطح مایع خنک‌کننده در مخزن انبساط\n- نشتی زیر خودرو و بوی ضدیخ\n- سلامت درب رادیاتور و شلنگ‌ها\n- عملکرد فن خنک‌کننده هنگام افزایش دما\n\nچک‌لیست سالانه:\n- تعویض ضدیخ با نسبت مناسب\n- شست‌وشوی پره‌های رادیاتور\n- تست ترموستات و درب فشار\n\nهرگز درب رادیاتور داغ را باز نکنید؛ فشار بخار می‌تواند باعث سوختگی شدید شود.''',
    ),
]


class Command(BaseCommand):
    help = 'بارگذاری داده‌های اولیه سایت CarInfo از نسخه اصلی HTML'

    def handle(self, *args, **options):
        created_categories = 0
        for name, slug in CATEGORIES:
            _, created = Category.objects.get_or_create(
                slug=slug, defaults={'name': name}
            )
            created_categories += int(created)

        created_parts = 0
        for item in PARTS:
            category = Category.objects.get(slug=_cat_slug(item['category']))
            defaults = {
                'name': item['name'],
                'en_name': item['en_name'],
                'location': item['location'],
                'lifespan': item['lifespan'],
                'image_url': item['image_url'],
                'short_description': item['short_description'],
                'description': item['description'],
                'function': item['function'],
                'failure_signs': item['failure_signs'],
                'maintenance_tips': item['maintenance_tips'],
                'category': category,
            }
            _, created = Part.objects.get_or_create(
                slug=item['slug'], defaults=defaults
            )
            created_parts += int(created)

        created_warnings = 0
        for item in WARNING_LIGHTS:
            _, created = WarningLight.objects.get_or_create(
                slug=item['slug'],
                defaults={
                    'title': item['title'],
                    'meaning': item['meaning'],
                    'severity': item['severity'],
                    'recommended_action': item['action'],
                },
            )
            created_warnings += int(created)

        created_obd = 0
        for item in OBD_CODES:
            _, created = OBDCode.objects.get_or_create(
                code=item['code'], defaults=item
            )
            created_obd += int(created)

        created_glossary = 0
        for term, en, desc, category in GLOSSARY:
            _, created = Glossary.objects.get_or_create(
                term=term,
                defaults={
                    'english_term': en,
                    'description': desc,
                    'category': category,
                },
            )
            created_glossary += int(created)

        created_quiz = 0
        for item in QUIZ_QUESTIONS:
            part = Part.objects.filter(slug=item['part']).first()
            defaults = {
                'question': item['question'],
                'option_a': item['option_a'],
                'option_b': item['option_b'],
                'option_c': item['option_c'],
                'option_d': item['option_d'],
                'correct_answer': item['correct_answer'],
                'explanation': item['explanation'],
                'part': part,
            }
            _, created = QuizQuestion.objects.get_or_create(
                question=item['question'], defaults=defaults
            )
            created_quiz += int(created)

        created_guides = 0
        for item in GUIDES:
            defaults = {
                'title': item['title'],
                'category': item['category'],
                'image_url': item['image_url'],
                'short_description': item['short_description'],
                'content': item['content'],
                'is_published': True,
            }
            _, created = Guide.objects.get_or_create(
                slug=slugify(item['title'], allow_unicode=True), defaults=defaults
            )
            created_guides += int(created)

        self.stdout.write(
            self.style.SUCCESS(
                f'Seed انجام شد: {created_categories} دسته، {created_parts} قطعه، '
                f'{created_warnings} چراغ هشدار، {created_obd} کد OBD، '
                f'{created_glossary} واژه، {created_quiz} سوال و {created_guides} آموزش.'
            )
        )


def _cat_slug(name):
    return {
        'موتور و احتراق': 'motor',
        'برق و شارژ': 'electrical',
        'خنک‌کننده': 'cooling',
        'ترمز و تعلیق': 'brake-suspension',
    }.get(name, 'motor')
