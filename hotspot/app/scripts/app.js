'use strict';
/**
 * @ngdoc overview
 * @name masterHotspotApp
 * @description
 * # masterHotspotApp
 *
 * Main module of the application.
 */
window.businessConfig = window.businessConfig || {};
var app = angular
  .module('masterHotspotApp', [
    'ngResource',
    'ngRoute',
    'ui.router',
    'pascalprecht.translate',
    'ngTouch',
    'ngRaven',
    'toaster',
    'oc.lazyLoad',
    'ui.bootstrap',
  ])
  .config([
    '$stateProvider',
    '$urlRouterProvider',
    '$controllerProvider',
    '$compileProvider',
    '$filterProvider',
    '$provide',
    '$translateProvider',
    'JQ_CONFIG',
    'MODULE_CONFIG',
    function(
      $stateProvider,
      $urlRouterProvider,
      $controllerProvider,
      $compileProvider,
      $filterProvider,
      $provide,
      $translateProvider,
      JQ_CONFIG,
      MODULE_CONFIG,
    ) {
      $stateProvider
        .state('home', {
          template:
            '<div style="width: 80%;margin: 0 auto;text-align: center;margin-top: 250px;">Loading</div>',
          url: '/home.html',
          controller: 'appCtrl',
        })
        .state('theme', {
          abstract: true,
          templateUrl: businessConfig.themeConfig.template + 'Layout.tpl.html',
          url: '/' + businessConfig.selectedThemeId,
          resolve: load(
            [
              'hotspotplus.tpls.' + businessConfig.themeConfig.template,
              'themeStyles/' +
                businessConfig.selectedThemeId +
                '/' +
                businessConfig.themeConfig[businessConfig.selectedThemeId]
                  .style +
                '.css',
            ],
            JQ_CONFIG,
            MODULE_CONFIG,
          ),
        })
        .state('theme.signin', {
          templateUrl: businessConfig.themeConfig.template + 'SignIn.tpl.html',
          controller: businessConfig.themeConfig.controller + 'SignInCtrl',
          url: '/signin.html',
        })
        .state('theme.signup', {
          templateUrl: businessConfig.themeConfig.template + 'SignUp.tpl.html',
          controller: businessConfig.themeConfig.controller + 'SignUpCtrl',
          url: '/signup.html',
        })
        .state('theme.forgetpassword', {
          templateUrl:
            businessConfig.themeConfig.template + 'ForgetPassword.tpl.html',
          controller:
            businessConfig.themeConfig.controller + 'ForgetPasswordCtrl',
          url: '/forgetPassword.html',
        })
        .state('theme.verify', {
          templateUrl: businessConfig.themeConfig.template + 'Verify.tpl.html',
          controller: businessConfig.themeConfig.controller + 'VerifyCtrl',
          url: '/verify.html',
        })
        .state('theme.selectVerification', {
          templateUrl:
            businessConfig.themeConfig.template + 'SelectVerification.tpl.html',
          controller:
            businessConfig.themeConfig.controller + 'SelectVerificationCtrl',
          url: '/selectVerification.html',
        })
        .state('theme.internetplans', {
          templateUrl:
            businessConfig.themeConfig.template + 'InternetPlan.tpl.html',
          controller:
            businessConfig.themeConfig.controller + 'InternetPlanListCtrl',
          url: '/internetplans.html',
        })
        .state('theme.status', {
          templateUrl: businessConfig.themeConfig.template + 'Status.tpl.html',
          controller: businessConfig.themeConfig.controller + 'StatusCtrl',
          url: '/status.html',
          params: {
            online: null,
            ip: null,
            download: null,
            upload: null,
            uptime: null,
            sessionTime: null,
          },
        })
        .state('theme.lang', {
          templateUrl: businessConfig.themeConfig.template + 'Lang.tpl.html',
          controller: businessConfig.themeConfig.controller + 'LangCtrl',
          url: '/lang.html',
        })
        .state('theme.welcome', {
          templateUrl: businessConfig.themeConfig.template + 'Welcome.tpl.html',
          controller: businessConfig.themeConfig.controller + 'WelcomeCtrl',
          url: '/welcome.html',
        });
      $urlRouterProvider.otherwise('/home.html');
      $translateProvider.translations('fa', {
        'RADIUS server is not responding':
          'آی پی روتر شما شناسایی نشد و یا secret روتر شما صحیح نیست با پشتیبانی تماس بگیرید.',
        loyaltySignUpHeader:
          'با عضویت در باشگاه مشتریان ما از اتصال به اینترنت پر سرعت بهره‌مند شوید.',
        welcomePageLogin: 'ورود به اینترنت',
        loyaltySignInHeader: 'شما با موفقیت وارد باشگاه مشتریان ما شدید.',
        failedToReadProfile: 'خطایی در خواندن اطلاعات رخ داده است.',
        passwordAndUsernameAreRequired: 'نام کاربری و رمز عبور الزامی است.',
        'password is a required argument':
          'پیام لوکال: نام کاربری و رمز عبور الزامی است.',
        'invalid username or password': 'پیام لوکال: نام کاربری صحیح نیست.',
        checkHotspotNetworkConnection:
          'روتر شبکه‌ی شما در دسترس نیست، از اتصال به شبکه‌ی هات‌اسپات اطمینان پیدا کنید.',
        verifyHeaderText:
          'کد تایید ۴ رقمی برای شما پیامک شد، کد را  پس از دریافت وارد کنید.',
        alreadyMember:
          "در حال حاضر شما عضو هستید و نمی توانید دوباره عضو شوید. اگر رمز عبور خود را فراموش کرده‌اید بر روی 'رمز را فراموش کرده‌ام' بزنید یا به متصدی شبکه مراجعه کنید.",
        noPublicPlan: 'هیچ پلن اینترنتی وجود ندارد.',
        thisDeviceIsLockedByOtherUser:
          'این دستگاه به نام کاربری دیگری اختصاص داده شده است، اگر رمز عبور خود را فراموش کرده‌اید از بازیابی رمز عبور استفاده کنید.',
        timeout:
          'به دلیل شلوغی شبکه‌ی وای‌فای و یا دور بودن از آنتن‌های وایرلس، اتصال شما به شبکه‌ی وای‌فای دچار اختلال شده است و درخواست‌های شما ارسال نمی‌شود.',
        logout: 'خروج',
        nasIdIsInvalid:
          'شناسه‌ی روتر شما صحیح نیست. شناسه را از پروفایل روتر کپی و به عنوان nas identity تنظیم کنید.',
        bizIdIsInvalid: 'خطایی در خواندن تنظیمات تم شما رخ داده است.',
        bizNotFound: 'شناسه این شبکه معتبر نیست.',
        verifyTitle: 'تایید موبایل',
        enterVerificationCode: 'کد تایید را وارد نمایید',
        youAreConnected: 'شما با موفقیت به اینترنت متصل شدید.',
        loggedInSuccessfully: 'شما با موفقیت وارد و به اینترنت متصل شدید.',
        invalidCode: 'کد صحیح نیست',
        congrats: 'تبریک',
        confirm: 'تایید',
        warning: 'هشدار',
        verificationCode: 'کد تایید',
        verificationCodeError: 'کد تایید نادرست است',
        verificationMethod: 'روش تایید هویت',
        chooseVerificationMethod: 'روش تایید هویت را انتخاب کنید',
        mobileVerification: 'تایید هویت از طریق دریافت پیامک حاوی کد تایید',
        supervisorVerification: 'تایید هویت از طریق مراجعه به مسئول شبکه',
        memberExistPleaseContactOperatorForManualVerification:
          'برای فعال سازی این حساب کاربری به مسئول شبکه مراجعه کنید.',
        pleaseContactOperatorForManualVerification:
          'این کاربر ثبت شده است اما فعال نیست، برای فعال سازی این حساب کاربری به مسئول شبکه مراجعه کنید.',
        freeInternetPlan: 'بسته ی رایگان',
        freePlanActivationFailed:
          'خطایی در فعال سازی بسته ی اینترنت رایگان شما رخ داده است.',
        freePlanActivated: 'بسته ی اینترنت رایگان شما فعال شد.',
        signUpSuccess: 'عضویت شما با موفقیت انجام شد. ',
        loading: 'چند لحظه صبر کنید',
        mobile: 'موبایل',
        waitOneMinute:
          'شما باید حداقل {0} دقیقه برای دریافت پیامک کد تایید صبر کنید، سپس می توانید درخواست ارسال مجدد کد را صادر کنید',
        resendVerification: 'ارسال مجدد کد',
        requiredField: '*',
        userNotFound: 'کاربری با این مشخصات پیدا نشد',
        generalError: 'خطایی در برنامه رخ داده است',
        serverConnectionError:
          'خطایی در ارسال اطلاعات شما رخ داده است، از اتصال به شبکه‌ی هات‌اسپات اطمینان پیدا کنید.',
        paymentError: 'خطا در پرداخت',
        requiredMessage: 'وارد کردن این فیلد الزامی است',
        requiredFieldTitle: 'تکمیل کردن فیلد های ستاره دار الزامی است.',
        firstName: 'نام',
        lastName: 'نام خانوادگی',
        fullName: 'نام کامل',
        username: 'نام کاربری',
        password: 'رمز عبور',
        pinCode: 'رمز دوم',
        confirmPassword: 'تکرار رمز عبور',
        age: 'سن',
        email: 'ایمیل',
        nationalCode: 'کد ملی',
        roomNumber: 'شماره اتاق',
        passportNumber: 'شماره گذرنامه',
        birthdayYear: 'سال تولد، مثال: ۱۳۵۹',
        birthdayMonth: 'ماه تولد',
        birthdayDay: 'روز تولد، مثال: ۱۲',
        birthdayUndefined: 'تاریخ تولد را کامل وارد کنید.',
        nationalCodeUndefined: 'کد ملی نامعتبر می باشد.',
        studentGrade: 'مقطع تحصیلی',
        studentId: 'شماره دانشجویی',
        preBachelor: 'کاردانی',
        bachelor: 'کارشناسی',
        master: 'کارشناسی ارشد',
        doctorate: 'دکترا',
        error: 'خطا',
        login: 'ورود',
        unknownError: 'خطای ناشناخته، لطفا دقایقی دیگر دوباره تلاش کنید',
        okay: 'خب',
        loginWithUsername: 'ورود',
        loginToByInternetPlan:
          'برای خرید بسته ی اینترنت لازم است با نام کاربری و رمز عبور وارد شوید.',
        usernameAndPasswordSent: 'نام کاربری و رمز عبور برای شما پیامک شد',
        forgotPasswordTitle: 'بازیابی رمز عبور',
        forgotPasswordHeaderText:
          'نام کاربری و یا شماره موبایل خود را وارد کنید تا رمز برای شما پیامک شود.',
        invalidUsernameOrPassword: 'نام کاربری یا رمز عبور صحیح نیست',
        usernameOrMobile: 'شماره موبایل',
        invalidMobile: 'شماره موبایل ثبت نشده',
        invalidPassword: 'رمز عبور صحیح نیست',
        signUpTitle: 'عضویت',
        signUpHeaderText: 'با تکمیل فرم زیر به باشگاه مشتریان ما ملحق شوید.',
        signUpBtn: 'عضو می‌شوم',
        registerBtn: 'ثبت‌ نام',
        forgotPassword: 'رمز را فراموش کرده‌ام',
        homeTitle: 'شبکه های اجتماعی',
        homeHeaderText: 'ما را در شبکه های اجتماعی دنبال کنید',
        signInPhoneNumberHeaderText: 'شماره موبایل خود را وارد نمایید',
        signInTitle: 'ورود',
        signInHeaderText: 'با نام کاربری و رمز عبور وارد شوید',
        signInPasswordTitle: 'ورود',
        signInPasswordHeaderText: 'رمز خود را وارد نمایید',
        pinCodeRequired: 'وارد کردن رمز دوم الزامی است.',
        '500': 'خطایی در سمت سرور رخ داده با مدیر شبکه تماس بگیرید',
        '600': 'خطایی در سمت سرور رخ داده با مدیر شبکه تماس بگیرید',
        '604': 'خطایی در سمت سرور رخ داده با مدیر شبکه تماس بگیرید',
        '601': 'شما هیچ بسته ی اینترنتی ندارید، ابتدا یک بسته انتخاب کنید',
        '602': 'زمان استفاده ی شما از اینترنت به اتمام رسیده است',
        '603': 'حجم مصرفی شما به اتمام رسیده است',
        '605': 'مدت بسته ی اینترنت شما به اتمام رسیده است',
        internetIsOver: 'اینترنت شما به اتمام رسیده است.',
        '606':
          'یک نفر دیگر با این نام کاربری در حال استفاده از اینترنت است، دقایقی دیگر تلاش کنید',
        '608': 'این نام کاربری مجاز به ورود از این دستگاه نمی‌باشد.',
        signInBtn: 'ورود',
        signOutBtn: 'خروج',
        internetPlans: 'بسته ها',
        internetPlan: 'بسته',
        daily: 'روزه',
        day: 'روز',
        monthly: 'ماهه',
        month: 'ماه',
        planBulk: 'حجم',
        planSpeed: 'سرعت',
        planPrice: 'قیمت',
        planTime: 'مدت',
        toman: 'تومان',
        rial: 'ریال',
        internetPlansTitle: 'بسته های اینترنت',
        selectPlansHeaderText: 'بسته اینترنت مورد نظر خود را انتخاب کنید',
        noInternetPlanFound:
          'بسته اینترنتی پیدا نشد. لطفا یک بسته اینترنت خریداری یا فعال کنید.',
        internetPlansPayment: 'پرداخت از طریق درگاه بانک',
        internetPlansPaymentInfo: 'اطلاعات بسته اینترنت شما',
        internetPlansAssigned: 'خرید با موفقیت انجام شد',
        internetPlansActivate: 'فعالسازی رایگان بسته اینترنت',
        errorLoadingPage: 'خطایی در برنامه رخ داده است.',
        skip: 'بیخیال',
        becomeMember: 'عضویت در باشگاه مشتریان',
        facebook: 'فیسبوک',
        telegram: 'تلگرام',
        instagram: 'اینستاگرام',
        male: 'آقا',
        female: 'خانم',
        birthday: 'تاریخ تولد 1364/1/1',
        signUp: 'عضو می شوم',
        signUpVerificationError:
          'تعداد درخواست‌های کد تایید شما از حد مجاز بیشتر شده است، به مدیر شبکه مراجعه کنید.',
        invalidPaymentVerify: 'خطای تایید پرداخت',
        insufficientBusinessCredit: 'اعتبار موجود برای ارسال پیامک کافی نیست',
        signInSignInCheckBoxText: 'رمز خود را فراموش کرده ام',
        send: 'ارسال',
        passwordsNotMatch: 'رمزها یکسان نیستند',
        logo: 'لوگو',
        copyright: '©۱۳۹۵-۱۳۹۶ هات اسپات پلاس',
        chooseLanguageFa: 'فارسی',
        chooseLanguageEn: 'English',
        back: 'بازگشت',
        getPasswordFromReceptionist: 'رمز خود را از مسئول شبکه دریافت کنید.',
        activateInternetPlan:
          'برای فعال سازی بسته اینترنت خود با مسئول شبکه تماس بگیرید.',
        activateUsername:
          'این نام کاربری هنوز فعال نشده است. برای فعال شدن این نام کاربری می توانید تایید هویت پیامکی انجام دهید و یا به مسئول اینترنت مراجعه کنید.',
        errorLogOutPage: 'خطا در هنگام خروج از برنامه',
        minute: 'دقیقه',
        unlimited: 'نامحدود',
        connectionTime: 'زمان اتصال',
        timeDuration: ' مدت زمان',
        fromTime: 'از ساعت',
        toTime: 'تا ساعت',
        memberInfoTitle: 'اطلاعات حساب',
        packageName: 'نام بسته',
        timeRemain: 'زمان باقیمانده',
        bulkRemain: 'حجم باقیمانده',
        buyPackageBtn: 'خرید بسته',
        changePackageBtn: 'تغییر بسته',
        gender: 'جنسیت',
        KB: 'کیلو بایت',
        MB: 'مگا بایت',
        GB: 'گیگابایت',
        Kbps: 'کیلو بیت در ثانیه',
        Mbps: 'مگا بیت در ثانیه',
        Gbps: 'گیگا بیت در ثانیه',
        badRequest: 'اطلاعات ورودی لازم را وارد کنید',
        IncorrectMobileNumber: 'شماره موبایل صحیح نیست',
        verificationResend: 'کد تایید مجددا ارسال شد',
        defaultPlanActivatedMax:
          'شما فعلا مجاز به استفاده‌ی مجدد از این بسته نیستید.',
        defaultPlanActivatedError: 'خطا در فعال سازی بسته اینترنت پیش فرض',
        invalidMobileNumber: 'شماره موبایل نامعتبر',
        invalidNationalCode: 'کد ملی نامعتبر',
        invalidEmailAddress: 'آدرس ایمیل نامعتبر',
        invalidAge: 'سن نامعتبر',
        invalidBirthday: 'تاریخ تولد نامعتبر',
        month1: 'فروردین',
        month2: 'اردیبهشت',
        month3: 'خرداد',
        month4: 'تیر',
        month5: 'مرداد',
        month6: 'شهریور',
        month7: 'مهر',
        month8: 'آبان',
        month9: 'آذر',
        month10: 'دی',
        month11: 'بهمن',
        month12: 'اسفند',
        attention: 'توجه',
        userAlreadyExist: 'این نام کاربری قبلا استفاده شده است',
        google: 'برو به گوگل',
        recoverySmsSent: 'رمز عبور به موبایل شما پیامک شد',
        yourIp: 'آی پی شما',
        download: 'دانلود',
        upload: 'آپلود',
        upTime: 'مدت زمان اتصال',
        statusHeaderText: 'وضعیت',
        loyaltyStatusHeaderText: 'شما به اینترنت متصل شدید',
        loyaltyWelcomeHeader: 'به باشگاه مشتریان ما خوش آمدید.',
        connectBtn: 'اتصال به اینترنت',
        noVerificationNeeded: 'عدم نیاز به تایید هویت',
      });
      $translateProvider.translations('en', {
        checkHotspotNetworkConnection:
          'Your router is not accessible, Please make sure you are connected to the Hotspot Wifi',
        loyaltySignUpHeader:
          'Please join our customer club to connect the internet',
        loyaltySignInHeader: 'You are signed in successfully',
        passwordAndUsernameAreRequired: 'Password and Username are Required',
        verifyHeaderText:
          'کد تایید ۴ رقمی برای شما پیامک شد، کد را  پس از دریافت وارد کنید',
        'password is a required argument': 'نام کاربری و رمز عبور الزامی است.',
        alreadyMember:
          "User exist, If you forgot your password please use 'password recovery' or contact network administrator",
        verifyTitle: 'تایید موبایل',
        enterVerificationCode: 'Enter verification code',
        youAreConnected: 'شما با موفقیت به اینترنت متصل شدید.',
        loggedInSuccessfully: 'شما با موفقیت وارد و به اینترنت متصل شدید.',
        invalidCode: 'کد صحیح نیست',
        pleaseContactOperatorForManualVerification:
          'Sign up completed to activate your account, contact network administrator.',
        memberExistPleaseContactOperatorForManualVerification:
          'User exist exist but is disabled, please contact network administrator.',
        congrats: 'تبریک',
        confirm: 'Confirm',
        warning: 'هشدار',
        verificationCode: 'Verification Code',
        verificationMethod: 'Verification Method',
        chooseVerificationMethod: 'Choose Verification Method',
        mobileVerification: 'SMS Verification',
        supervisorVerification: 'Verification By Supervisor',
        freeInternetPlan: 'Free Package',
        freePlanActivationFailed:
          'An Error Has Occurred in Activating Free Internet Package',
        freePlanActivated: 'Free Plan Activated Successfully',
        signUpSuccess:
          'عضویت شما با موفقیت انجام شد.شما میتوانید با نام کاربری و رمز عبوری که برای شما پیامک شده لاگین کنید. ',
        loading: 'Please Wait',
        mobile: 'mobile',
        waitOneMinute:
          'شما باید حداقل {0} دقیقه برای دریافت پیامک کد تایید صبر کنید، سپس می توانید درخواست ارسال مجدد کد را صادر کنید',
        resendVerification: 'Resend Verification Code',
        requiredField: '*',
        userNotFound: 'User Not Found',
        generalError: 'An Error Has Occurred, Please try again later',
        serverConnectionError: 'Server Connection Error',
        paymentError: 'Error in Payment',
        requiredMessage: 'Please Fill Out This Field',
        requiredFieldTitle: 'Fields Marked With * Are Required',
        firstName: 'First Name',
        lastName: 'Last Name',
        fullName: 'Full Name',
        username: 'Username',
        password: 'Password',
        pinCode: 'Pin code',
        confirmPassword: 'Confirm Password',
        age: 'Age',
        email: 'Email',
        nationalCode: 'NationalCode',
        birthdayYear: 'Year of Birth, Example: 1980',
        birthdayMonth: 'Month of Birth',
        birthdayDay: 'Day of Birth, Example: 12',
        birthdayUndefined: 'Fill Birthday Fields Completely',
        error: 'Error',
        login: 'Log In',
        unknownError: 'Unknown Error, Please try again later',
        okay: 'OK',
        loginWithUsername: 'Log In',
        loginToByInternetPlan:
          'For Buying Internet Package You Must Login First',
        usernameAndPasswordSent: 'نام کاربری و رمز عبور برای شما پیامک شد',
        recoverySmsSent: 'Your Password sent to Your Phone',
        forgotPasswordTitle: 'Forgot Password',
        forgotPasswordHeaderText:
          'نام کاربری و یا شماره موبایل خود را وارد کنید تا رمز برای شما پیامک شود.',
        invalidUsernameOrPassword: 'Incorrect Username or Password',
        invalidMobile: 'No Mobile Number Registered',
        invalidPassword: 'Invalid Password',
        signUpTitle: 'Sign Up',
        signUpHeaderText: 'با تکمیل فرم زیر به باشگاه مشتریان ما ملحق شوید.',
        signUpBtn: 'Sign Up',
        registerBtn: 'Sign Up',
        forgotPassword: 'Forgot password',
        homeTitle: 'Social Networks',
        homeHeaderText: 'Follow Us on Social Networks',
        signInPhoneNumberHeaderText: 'Enter Password',
        signInTitle: 'Sign In',
        signInHeaderText: 'Sign In with Username and Password',
        signInPasswordTitle: 'Sign In',
        signInPasswordHeaderText: 'Enter Password',
        '600': 'Server Error, Contact Network Admin',
        '604': 'Server Error, Contact Network Admin',
        '601': "You Don't Have Active Package, Buy One",
        '602': 'Your Internet usage Time has Been Completed',
        '603': 'Your Internet usage Bulk has Been Completed',
        '605': 'The Term of Your Internet Connection Has Expired',
        '606':
          'Another Person With This username is Using The Internet, Try Again Later',
        '608': 'You are not allowed to login from this device.',
        signInBtn: 'Sign In',
        signOutBtn: 'Sign Out',
        internetPlans: 'Internet Plans',
        internetPlan: 'Internet Plan',
        daily: 'Days',
        day: 'Day',
        monthly: 'Months',
        month: 'Month',
        planBulk: 'Bulk',
        planSpeed: 'Speed',
        planPrice: 'Price',
        planTime: 'Time',
        toman: 'Toman',
        rial: 'Rial',
        internetPlansTitle: 'Internet Packages',
        selectPlansHeaderText: 'Choose Your Internet Package',
        internetPlansPayment: 'Payment',
        internetPlansPaymentInfo: 'Your Internet Package Info',
        internetPlansAssigned: 'خرید با موفقیت انجام شد',
        errorLoadingPage: 'An Error Has Occurred in App',
        skip: 'بیخیال',
        becomeMember: 'عضویت در باشگاه مشتریان',
        facebook: 'فیسبوک',
        telegram: 'تلگرام',
        instagram: 'اینستاگرام',
        male: 'Male',
        female: 'Female',
        birthday: 'تاریخ تولد 1364/1/1',
        signUp: 'Sign Up',
        signUpVerificationError: 'Error Sending Too Much Verification Code',
        invalidPaymentVerify: 'خطای تایید پرداخت',
        insufficientBusinessCredit: 'اعتبار موجود برای ارسال پیامک کافی نیست',
        signInSignInCheckBoxText: 'رمز خود را فراموش کرده ام',
        send: 'Send',
        passwordsNotMatch: 'Password Not Match',
        copyright: '©2015-2017 Hotspotplus.ir',
        chooseLanguageFa: 'Persian Passengers',
        chooseLanguageEn: 'Foreign Passengers',
        back: 'Back',
        getPasswordFromReceptionist: 'Get Your Password From The Receptionist',
        activateInternetPlan:
          'For Activate Your Internet Package Call Receptionist',
        activateUsername: 'For Activate Your User Name Call Receptionist',
        errorLogOutPage: 'An Error Has Occurred in Logging Out of App',
        minute: 'Minute',
        unlimited: 'Unlimited',
        connectionTime: 'Connection Time',
        fromTime: 'from Hour',
        toTime: 'to Hour',
        memberInfoTitle: 'Account Information',
        packageName: 'package Name',
        timeRemain: 'Remaining Time',
        bulkRemain: 'Remaining Bulk',
        buyPackageBtn: 'Buy Package',
        roomNumber: 'Room Number',
        passportNumber: 'Passport Number',
        gender: 'Gender',
        badRequest: 'Please Check Your Data Entry',
        IncorrectMobileNumber: 'Incorrect Mobile Number',
        verificationResend: 'Verification Code Resend',
        defaultPlanActivatedMax:
          'Default InternetPlan Activated Too Many Times',
        defaultPlanActivatedError: 'Error in Activating Default InternetPlan',
        invalidMobileNumber: 'Invalid Mobile Number',
        invalidNationalCode: 'Invalid National Code',
        invalidEmailAddress: 'Invalid Email Address',
        invalidAge: 'Invalid Age',
        invalidBirthday: 'Invalid Birthday',
        attention: 'Attention',
        userAlreadyExist: 'Username Already Exist',
        google: 'Google',
        yourIp: 'Your Ip',
        download: 'Download',
        upload: 'Upload',
        upTime: 'Up Time',
        statusHeaderText: 'Status',
        loyaltyStatusHeaderText: 'You are connected to internet.',
        loyaltyWelcomeHeader: 'Welcome to the customer club',
        connectBtn: 'Connect to the internet',
        noVerificationNeeded: 'No verification needed.',
      });
      $translateProvider.preferredLanguage('fa');

      // lazy controller, directive and service
      app.controller = $controllerProvider.register;
      app.directive = $compileProvider.directive;
      app.filter = $filterProvider.register;
      app.factory = $provide.factory;
      app.service = $provide.service;
      app.constant = $provide.constant;
      app.value = $provide.value;
    },
  ])

  .value('config', {})

  .run([
    'config',
    '$log',
    '$location',
    'JQ_CONFIG',
    'MODULE_CONFIG',
    function(config, $log, $location) {
      angular.merge(config, window.businessConfig, {
        config: null,
        INTERNET_PLANS_FIND_URL:
          '/InternetPlans?filter[where][businessId]={0}&filter[order]=price {1}',
        SITE: 'https://hotspotplus.ir',
        LANGUAGE_FA: 'fa',
        LANGUAGE_EN: 'en',
        DIRECTION_RTL: 'rtl',
        DIRECTION_LTR: 'ltr',
        LOADING: 'loading',
        SIGN_IN: 'signIn',
        FORGET_PASS: 'forgetPassword',
        SIGN_UP: 'signUp',
        CHOOSE_LANGUAGE: 'chooseLang',
        VERIFY_MOBILE: 'verifyMobile',
        STATUS: 'status',
        INTERNET_PLANS: 'internetPlans',
        INTERNET_PLAN_INFO: 'internetPlanInfo',
        MESSAGE: 'message',
        ERROR: 'error',
        LOGIN_ERROR: 'invalidUsernameOrPassword',
      });
      config.resendTimeout = 3;
      var tags = {};
      /*angular.forEach ( $location.search (), function ( value, key ) {
		 if ( key == 'mac' ) {
		 config[ key ] = trimMac ( value )
		 } else {
		 config[ key ] = value
		 }
		 tags[ key ] = value
		 }
		 );*/
      tags.username = 'hotSpot';
    },
  ])
  .controller('appCtrl', [
    '$scope',
    '$state',
    'config',
    '$log',
    'appService',
    'routerService',
    '$location',
    'appMessenger',
    'translateFilter',
    'errorMessage',
    '$rootScope',
    function(
      $scope,
      $state,
      config,
      $log,
      appService,
      routerService,
      $rootScope,
    ) {
      $scope.DownloadUrlPrefix = window.API_URL;

      //config.signInUrl = businessConfig.signInUrl;
      //config.nasId = businessConfig.nasId;
      //config.accessPointType = businessConfig.accessPointType;
      //config.businessId = businessConfig.businessId;

      config.themeConfig = businessConfig.themeConfig || {};
      if (
        businessConfig &&
        businessConfig.clearTextPassword &&
        businessConfig.username
      ) {
        config.username = businessConfig.username;
        config.password = businessConfig.clearTextPassword;
      }
      config.selectedThemeConfig =
        businessConfig.themeConfig[businessConfig.selectedThemeId];
      if (config.selectedThemeConfig) {
        if (
          config.selectedThemeConfig.logo &&
          config.selectedThemeConfig.logo.id
        ) {
          config.logo = config.selectedThemeConfig.logo;
          config.logo.src =
            $scope.DownloadUrlPrefix + '/file/download/' + config.logo.id;
        } else {
          config.logo = {};
          config.logo.name = 'logo';
          config.logo.src = 'img/' + config.selectedThemeId + '/logo/logo.png';
        }
        if (
          config.selectedThemeConfig.background &&
          config.selectedThemeConfig.background.id
        ) {
          config.background = config.selectedThemeConfig.background;
          config.background.src =
            $scope.DownloadUrlPrefix + '/file/download/' + config.background.id;
        } else {
          config.background = {};
          config.background.src =
            'img/' +
            config.selectedThemeId +
            '/background/' +
            config.selectedThemeConfig.style +
            '.jpg';
        }
        if (config.selectedThemeConfig.logoFooter) {
          config.logoFooter = config.selectedThemeConfig.logoFooter;
        }
        if (config.selectedThemeConfig.logoFooterEn) {
          config.logoFooterEn = config.selectedThemeConfig.logoFooterEn;
        }
        document.body.style.backgroundImage =
          'url(' + config.background.src + ')';
      }

      function getLandingState() {
        if (config.selectedThemeConfig.isMultiLanguage) {
          return 'theme.lang';
        } else {
          config.localLang = config.LANGUAGE_FA;
          config.direction = config.DIRECTION_RTL;
          $rootScope.logoFooter = config.logoFooter;
          return 'theme.signin';
        }
      }

      routerService.isLogin(function(error, clientStatus) {
        if (error) {
          $log.error(error);
        }
        if (clientStatus && clientStatus.online === true) {
          $state.go('theme.status', clientStatus);
        } else {
          $state.go(getLandingState());
        }
      });
    },
  ]);

function load(srcs, JQ_CONFIG, MODULE_CONFIG, callback) {
  return {
    deps: [
      '$ocLazyLoad',
      '$q',
      function($ocLazyLoad, $q) {
        var deferred = $q.defer();
        var promise = false;
        srcs = angular.isArray(srcs) ? srcs : srcs.split(/\s+/);
        if (!promise) {
          promise = deferred.promise;
        }
        angular.forEach(srcs, function(src) {
          promise = promise.then(function() {
            if (JQ_CONFIG[src]) {
              return $ocLazyLoad.load(JQ_CONFIG[src]);
            }
            var name;
            angular.forEach(MODULE_CONFIG, function(module) {
              if (module.name == src) {
                name = module.name;
              } else {
                name = src;
              }
            });
            return $ocLazyLoad.load(name);
          });
        });
        deferred.resolve();
        return callback
          ? promise.then(function() {
              return callback();
            })
          : promise;
      },
    ],
  };
}
