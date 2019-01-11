angular.module('hotspotplus.tpls.alpha', [
  'alphaForgetPassword.tpl.html',
  'alphaInternetPlan.tpl.html',
  'alphaLang.tpl.html',
  'alphaLayout.tpl.html',
  'alphaSignIn.tpl.html',
  'alphaSignUp.tpl.html',
  'alphaStatus.tpl.html',
  'alphaVerify.tpl.html',
]);

angular.module('alphaForgetPassword.tpl.html', []).run([
  '$templateCache',
  function($templateCache) {
    $templateCache.put(
      'alphaForgetPassword.tpl.html',
      '<section desc="ForgetPassword">\n' +
        '  <div class="row">\n' +
        '    <form class="col-md-6 col-md-offset-3 col-sm-12">\n' +
        '      <h4 class="wrapper-xs text-center alpha-header-text">\n' +
        '        {{"forgotPasswordTitle" | translate}}\n' +
        '      </h4>\n' +
        '      <div class="form-group" ng-class="{\'has-error\' : !user.usernameOrMobile}">\n' +
        '        <input type="text" class="alpha-input form-control text-center dir-ltr"\n' +
        "               placeholder=\"{{' * '+('mobile' | translate)}}\"\n" +
        '               ng-model="user.usernameOrMobile"\n' +
        '               autofocus>\n' +
        '      </div>\n' +
        '      <div class="form-group text-center">\n' +
        '        <small class="alpha-info-text">\n' +
        "          {{'requiredFieldTitle' | translate}}\n" +
        '        </small>\n' +
        '      </div>\n' +
        '      <div class="form-group">\n' +
        '        <button class="btn alpha-btn alpha-btn-primary btn-block" ng-click="sendMyPassword()">{{\'forgotPasswordTitle\'|\n' +
        '          translate}}\n' +
        '        </button>\n' +
        '      </div>\n' +
        '      <div class="form-group">\n' +
        '        <button class="btn btn-block alpha-btn alpha-btn-default" type="button" ng-click="goBack(\'forgetpassword\')">\n' +
        "          {{'back' | translate}}\n" +
        '        </button>\n' +
        '      </div>\n' +
        '    </form>\n' +
        '  </div>\n' +
        '</section>\n' +
        '',
    );
  },
]);

angular.module('alphaInternetPlan.tpl.html', []).run([
  '$templateCache',
  function($templateCache) {
    $templateCache.put(
      'alphaInternetPlan.tpl.html',
      '<section desc="InternetPlans">\n' +
        '  <div class="row">\n' +
        '    <form class="col-md-6 col-md-offset-3 col-sm-12">\n' +
        '      <h4 class="wrapper-xs text-center alpha-header-text">\n' +
        "        {{'selectPlansHeaderText'|translate}}\n" +
        '      </h4>\n' +
        '      <div class="form-group" ng-repeat="plan in plans">\n' +
        '        <div class="panel alpha-panel-default">\n' +
        '          <div class="panel-heading">\n' +
        '            <span class="panel-title">{{plan.name}}</span>\n' +
        '          </div>\n' +
        '          <div class="panel-body">\n' +
        '            <div>\n' +
        '              <span>{{plan.duration | persianNumber}}</span>\n' +
        '              <span ng-if="plan.type !== \'dynamic\'">\n' +
        '              {{plan.type | translate}}\n' +
        '              </span>\n' +
        '              <span ng-if="plan.type === \'dynamic\'">\n' +
        "              {{'daily' | translate}}\n" +
        '              </span>\n' +
        '            </div>\n' +
        '            <div ng-if="plan.bulk.value != 0">{{\'planBulk\' | translate}} : {{plan.bulk.value |\n' +
        '              persianNumber}} {{plan.bulk.type | translate}}\n' +
        '            </div>\n' +
        "            <div ng-if=\"plan.bulk.value == 0\">{{'planBulk' | translate}} : {{'unlimited' | translate}}\n" +
        '            </div>\n' +
        "            <div>{{'planSpeed' | translate}} : {{plan.speed.value | persianNumber}}\n" +
        '              {{plan.speed.type | translate}}\n' +
        '            </div>\n' +
        '            <div ng-if="plan.fromToCheck">\n' +
        "              <span>{{'connectionTime' | translate}} : </span>\n" +
        "              <span>{{'fromTime' | translate}} {{plan.fromHour | persianNumber}}:{{plan.fromMinute | persianNumber}}</span>\n" +
        "              <span> {{'toTime' | translate}} {{plan.toHour | persianNumber}}:{{plan.toMinute | persianNumber}}</span>\n" +
        '            </div>\n' +
        '            <div>\n' +
        "              <span>{{'timeDuration' | translate}} : </span>\n" +
        '              <span ng-if="plan.timeDuration != 0">{{plan.timeDuration | persianNumber}} {{\'minute\' | translate}}</span>\n' +
        '              <span ng-if="plan.timeDuration == 0">{{\'unlimited\' | translate}}</span>\n' +
        '            </div>\n' +
        '            <div ng-if="plan.price != 0">{{\'planPrice\' | translate}} : {{plan.price |\n' +
        "              persianNumber}} {{'toman' | translate}}\n" +
        '            </div>\n' +
        '            <div ng-if="plan.price == 0">{{\'freeInternetPlan\' | translate}}</div>\n' +
        '          </div>\n' +
        '          <div class="panel-footer">\n' +
        '            <button class="btn alpha-btn-primary btn-block" type="submit" ng-click="payment(plan)">\n' +
        '              <span ng-if="plan.price != 0">{{\'internetPlansPayment\'| translate}}</span>\n' +
        '              <span ng-if="plan.price == 0">{{\'internetPlansActivate\'| translate}}</span>\n' +
        '            </button>\n' +
        '          </div>\n' +
        '        </div>\n' +
        '      </div>\n' +
        '      <div class="form-group">\n' +
        '        <button class="btn btn-block alpha-btn alpha-btn-default" type="button" ng-click="goBack(\'internetplans\')">\n' +
        "          {{'back' | translate}}\n" +
        '        </button>\n' +
        '      </div>\n' +
        '    </form>\n' +
        '  </div>\n' +
        '</section>\n' +
        '',
    );
  },
]);

angular.module('alphaLang.tpl.html', []).run([
  '$templateCache',
  function($templateCache) {
    $templateCache.put(
      'alphaLang.tpl.html',
      '<section desc="ChooseLanguage">\n' +
        '  <div class="row alpha-margin-top-15vh">\n' +
        '      <form class="col-md-6 col-md-offset-3 col-sm-12">\n' +
        '        <div class="form-group">\n' +
        '          <button class="btn btn-block alpha-btn alpha-btn-primary" type="submit" ng-click="setLang(\'fa\')">فارسی</button>\n' +
        '        </div>\n' +
        '        <div class="form-group">\n' +
        '          <button class="btn btn-block alpha-btn alpha-btn-default" type="submit" ng-click="setLang(\'en\')">English</button>\n' +
        '        </div>\n' +
        '      </form>\n' +
        '  </div>\n' +
        '</section>\n' +
        '',
    );
  },
]);

angular.module('alphaLayout.tpl.html', []).run([
  '$templateCache',
  function($templateCache) {
    $templateCache.put(
      'alphaLayout.tpl.html',
      '<div ng-controller="baseCtrl">\n' +
        "  <toaster-container toaster-options=\"{'position-class': 'toast-top-right', 'close-button':true, 'time-out': 60000}\"></toaster-container>\n" +
        '  <div class="div-logo">\n' +
        '    <img ng-if="themeConfig.showLogo" class="logo-img" ng-src="{{logo.src}}" alt="{{logo.name}}">\n' +
        '    <h5 class="wrapper-xs text-center alpha-header-text">\n' +
        '      <span>{{logoFooter}}</span>\n' +
        '    </h5>\n' +
        '  </div>\n' +
        '  <ui-view></ui-view>\n' +
        '  <div class="text-center">\n' +
        '    <a ng-click="goToSite()">\n' +
        '      <small class="text-center alpha-footer-text">\n' +
        '        {{"copyright"|translate}}\n' +
        '      </small>\n' +
        '    </a>\n' +
        '  </div>\n' +
        '</div>\n' +
        '\n' +
        '',
    );
  },
]);

angular.module('alphaSignIn.tpl.html', []).run([
  '$templateCache',
  function($templateCache) {
    $templateCache.put(
      'alphaSignIn.tpl.html',
      '<section desc="SignIn">\n' +
        '    <div class="row">\n' +
        '        <form ng-form-commit class="col-md-6 col-md-offset-3 col-sm-12" name="signInForm" action="{{formAction}}" method="post">\n' +
        '            <h4 class="wrapper-xs text-center alpha-header-text">\n' +
        '                {{signInTitle | translate}}\n' +
        '            </h4>\n' +
        '            <div class="form-group">\n' +
        '                <input type="text" class="alpha-input form-control text-center dir-ltr"\n' +
        '                       name="username"\n' +
        '                       placeholder="{{\'username\'|translate}}   &#xf2c0;"\n' +
        '                       ng-model="user.username"\n' +
        '                       autofocus>\n' +
        '            </div>\n' +
        '            <div class="form-group">\n' +
        '                <input type="password" class="alpha-input form-control text-center dir-ltr"\n' +
        '                       name="password"\n' +
        '                       placeholder="{{\'password\'| translate}}   &#x1f511;"\n' +
        '                       ng-model="user.password">\n' +
        '            </div>\n' +
        '            <div class="form-group">\n' +
        '                <input type="hidden" class="alpha-input form-control text-center dir-ltr"\n' +
        '                       name="userurl" value="{{signupDestination}}">\n' +
        '            </div>\n' +
        '            <div class="form-group" ng-if="showPinCode">\n' +
        '                <input type="password" class="alpha-input form-control text-center dir-ltr"\n' +
        '                       placeholder="{{\'pinCode\'| translate}}   &#x1f512;"\n' +
        '                       ng-model="user.hotSpotPinCode" id="pinCode">\n' +
        '            </div>\n' +
        '            <div class="form-group">\n' +
        '                <button class="btn btn-block alpha-btn alpha-btn-primary" type="button" ng-click="signIn(signInForm)">\n' +
        "                    {{'signInBtn' | translate}}\n" +
        '                </button>\n' +
        '            </div>\n' +
        '            <div class="form-group" ng-if="!signUpDisabled">\n' +
        '                <button class="btn btn-block alpha-btn alpha-btn-default" type="button" ui-sref="theme.signup">\n' +
        "                    {{'registerBtn' | translate}}\n" +
        '                </button>\n' +
        '            </div>\n' +
        '            <div class="form-group alpha-margin-15px">\n' +
        '                <a ui-sref="theme.forgetpassword" class="pull-left alpha-info-text">\n' +
        "                    <small>{{'forgotPassword'| translate}}</small>\n" +
        '                </a>\n' +
        '            </div>\n' +
        '        </form>\n' +
        '    </div>\n' +
        '</section>\n' +
        '',
    );
  },
]);

angular.module('alphaSignUp.tpl.html', []).run([
  '$templateCache',
  function($templateCache) {
    $templateCache.put(
      'alphaSignUp.tpl.html',
      '<section desc="SignUp">\n' +
        '    <div class="row">\n' +
        '        <form name="signUpForm" class="col-md-6 col-md-offset-3 col-sm-12" noValidate>\n' +
        '            <h4 class="wrapper-xs text-center alpha-header-text">\n' +
        '                {{signUpTitle | translate}}\n' +
        '            </h4>\n' +
        '            <div class="form-group" ng-if="verificationMethod == \'user\'">\n' +
        '                <select ng-model="user.verificationMethod" class="alpha-input form-control text-center alpha-select"\n' +
        '                        ng-required="{{config.required}}">\n' +
        '                    <option value="mobile">{{\'mobileVerification\'| translate}}</option>\n' +
        '                    <option value="manual">{{\'supervisorVerification\'| translate}}</option>\n' +
        '                </select>\n' +
        '            </div>\n' +
        '            <div class="form-group" ng-repeat="config in formConfig" ng-if="config.active"\n' +
        '                 ng-class="{\'has-error\' : config.required && !user[config.label]}">\n' +
        '                <div ng-switch="config.label">\n' +
        '                    <div ng-switch-when="mobile">\n' +
        '                        <input class="alpha-input form-control text-center dir-ltr"\n' +
        '                               ng-model="user.mobile"\n' +
        "                               placeholder=\"{{!config.required ? ('mobile' | translate) : ' * '+('mobile' | translate)}}\"\n" +
        '                               type="text"\n' +
        '                               ng-required="{{config.required}}">\n' +
        '                    </div>\n' +
        '                    <div ng-switch-when="email">\n' +
        '                        <input class="alpha-input form-control text-center dir-ltr"\n' +
        '                               ng-model="user.email"\n' +
        "                               placeholder=\"{{!config.required ? ('email' | translate) : ' * '+('email' | translate)}}\"\n" +
        '                               type="text" ng-required="{{config.required}}">\n' +
        '                    </div>\n' +
        '                    <div ng-switch-when="username">\n' +
        '                        <input class="alpha-input form-control text-center dir-ltr"\n' +
        '                               ng-model="user.username"\n' +
        "                               placeholder=\"{{!config.required ? ('username' | translate) : ' * '+('username' | translate)}}\"\n" +
        '                               type="text" ng-required="{{config.required}}">\n' +
        '                    </div>\n' +
        '                    <div ng-switch-when="age">\n' +
        '                        <input class="alpha-input form-control text-center dir-ltr"\n' +
        '                               ng-model="user.age"\n' +
        "                               placeholder=\"{{!config.required ? ('age' | translate) : ' * '+('age' | translate)}}\"\n" +
        '                               type="text" ng-required="{{config.required}}">\n' +
        '                    </div>\n' +
        '                    <div ng-switch-when="password">\n' +
        '                        <input class="alpha-input form-control text-center dir-ltr"\n' +
        '                               ng-model="user.password"\n' +
        "                               placeholder=\"{{!config.required ? ('password' | translate) : ' * '+('password' | translate)}}\"\n" +
        '                               type="password" ng-required="{{config.required}}">\n' +
        '                    </div>\n' +
        '                    <div ng-switch-when="confirmPassword">\n' +
        '                        <input class="alpha-input form-control text-center dir-ltr"\n' +
        '                               ng-model="user.confirmPassword"\n' +
        "                               placeholder=\"{{!config.required ? ('confirmPassword' | translate) : ' * '+('confirmPassword' | translate)}}\"\n" +
        '                               type="password" ng-required="{{config.required}}">\n' +
        '                    </div>\n' +
        '                    <div ng-switch-when="birthday">\n' +
        '                        <div class="form-group">\n' +
        '                            <input class="alpha-input form-control text-center dir-ltr"\n' +
        '                                   ng-model="user.birthYear"\n' +
        "                                   placeholder=\"{{!config.required ? ('birthdayYear' | translate) : ' * '+('birthdayYear' | translate)}}\"\n" +
        '                                   type="text" ng-required="{{config.required}}">\n' +
        '                        </div>\n' +
        '                        <div class="form-group">\n' +
        '                            <select ng-model="user.birthMonth" class="alpha-input form-control text-center alpha-select"\n' +
        '                                    ng-required="{{config.required}}">\n' +
        '                                <option value="" hidden>{{\'birthdayMonth\' | translate}}</option>\n' +
        "                                <option value=1>{{'month1' | translate}}</option>\n" +
        "                                <option value=2>{{'month2' | translate}}</option>\n" +
        "                                <option value=3>{{'month3' | translate}}</option>\n" +
        "                                <option value=4>{{'month4' | translate}}</option>\n" +
        "                                <option value=5>{{'month5' | translate}}</option>\n" +
        "                                <option value=6>{{'month6' | translate}}</option>\n" +
        "                                <option value=7>{{'month7' | translate}}</option>\n" +
        "                                <option value=8>{{'month8' | translate}}</option>\n" +
        "                                <option value=9>{{'month9' | translate}}</option>\n" +
        "                                <option value=10>{{'month10' | translate}}</option>\n" +
        "                                <option value=11>{{'month11' | translate}}</option>\n" +
        "                                <option value=12>{{'month12' | translate}}</option>\n" +
        '                            </select>\n' +
        '                        </div>\n' +
        '                        <div class="form-group">\n' +
        '                            <input class="alpha-input form-control text-center dir-ltr"\n' +
        '                                   ng-model="user.birthDay"\n' +
        "                                   placeholder=\"{{!config.required ? ('birthdayDay' | translate) : ' * '+('birthdayDay' | translate)}}\"\n" +
        '                                   type="text" ng-required="{{config.required}}">\n' +
        '                        </div>\n' +
        '                    </div>\n' +
        '                    <div ng-switch-when="firstName">\n' +
        '                        <input class="alpha-input form-control text-center dir-ltr"\n' +
        '                               ng-model="user.firstName"\n' +
        "                               placeholder=\"{{!config.required ? ('firstName' | translate) : ' * '+('firstName' | translate)}}\"\n" +
        '                               type="text" ng-required="{{config.required}}">\n' +
        '                    </div>\n' +
        '                    <div ng-switch-when="lastName">\n' +
        '                        <input class="alpha-input form-control text-center dir-ltr"\n' +
        '                               ng-model="user.lastName"\n' +
        "                               placeholder=\"{{!config.required ? ('lastName' | translate) : ' * '+('lastName' | translate)}}\"\n" +
        '                               type="text" ng-required="{{config.required}}">\n' +
        '                    </div>\n' +
        '                    <div ng-switch-when="fullName">\n' +
        '                        <input class="alpha-input form-control text-center dir-ltr"\n' +
        '                               ng-model="user.fullName"\n' +
        "                               placeholder=\"{{!config.required ? ('fullName' | translate) : ' * '+('fullName' | translate)}}\"\n" +
        '                               type="text" ng-required="{{config.required}}">\n' +
        '                    </div>\n' +
        '                    <div ng-switch-when="gender">\n' +
        '                        <select ng-model="user.gender" class="alpha-input form-control text-center alpha-select"\n' +
        '                                ng-required="{{config.required}}">\n' +
        '                            <option value="" hidden>{{\'gender\' | translate}}</option>\n' +
        '                            <option value="female">{{\'female\' | translate}}</option>\n' +
        '                            <option value="male">{{\'male\' | translate}}</option>\n' +
        '                        </select>\n' +
        '                    </div>\n' +
        '                    <div ng-switch-when="nationalCode">\n' +
        '                        <input class="alpha-input form-control text-center dir-ltr"\n' +
        '                               ng-model="user.nationalCode"\n' +
        "                               placeholder=\"{{!config.required ? ('nationalCode' | translate) : ' * '+('nationalCode' | translate)}}\"\n" +
        '                               type="text" ng-required="{{config.required}}">\n' +
        '                    </div>\n' +
        '                    <div ng-switch-when="roomNumber">\n' +
        '                        <input class="alpha-input form-control text-center dir-ltr"\n' +
        '                               ng-model="user.roomNumber"\n' +
        "                               placeholder=\"{{!config.required ? ('roomNumber' | translate) : ' * '+('roomNumber' | translate)}}\"\n" +
        '                               type="text" ng-required="{{config.required}}">\n' +
        '                    </div>\n' +
        '                    <div ng-switch-when="passportNumber">\n' +
        '                        <input class="alpha-input form-control text-center dir-ltr"\n' +
        '                               ng-model="user.passportNumber"\n' +
        "                               placeholder=\"{{!config.required ? ('passportNumber' | translate) : ' * '+('passportNumber' | translate)}}\"\n" +
        '                               type="text" ng-required="{{config.required}}">\n' +
        '                    </div>\n' +
        '                    <div ng-switch-when="studentGrade">\n' +
        '                        <select ng-model="user.studentGrade" class="alpha-input form-control text-center alpha-select"\n' +
        '                                ng-required="{{config.required}}">\n' +
        '                            <option value="" hidden>{{\'studentGrade\' | translate}}</option>\n' +
        '                            <option value="preBachelor">{{\'preBachelor\' | translate}}</option>\n' +
        '                            <option value="bachelor">{{\'bachelor\' | translate}}</option>\n' +
        '                            <option value="master">{{\'master\' | translate}}</option>\n' +
        '                            <option value="doctorate">{{\'doctorate\' | translate}}</option>\n' +
        '                        </select>\n' +
        '                    </div>\n' +
        '                    <div ng-switch-when="studentId">\n' +
        '                        <input class="alpha-input form-control text-center dir-ltr"\n' +
        '                               ng-model="user.studentId"\n' +
        "                               placeholder=\"{{!config.required ? ('studentId' | translate) : ' * '+('studentId' | translate)}}\"\n" +
        '                               type="text" ng-required="{{config.required}}">\n' +
        '                    </div>\n' +
        '                </div>\n' +
        '            </div>\n' +
        '            <div class="form-group text-center">\n' +
        '                <small class="alpha-info-text">\n' +
        "                    {{'requiredFieldTitle' | translate}}\n" +
        '                </small>\n' +
        '            </div>\n' +
        '            <div class="form-group">\n' +
        '                <button class="btn alpha-btn alpha-btn-primary btn-block" type="submit"\n' +
        '                        ng-click="signUp(signUpForm.$error.required)">\n' +
        "                    {{'signUpBtn' | translate}}\n" +
        '                </button>\n' +
        '            </div>\n' +
        '            <div class="form-group">\n' +
        '                <button class="btn btn-block alpha-btn alpha-btn-default" type="button" ng-click="goBack(\'signup\')">\n' +
        "                    {{'back' | translate}}\n" +
        '                </button>\n' +
        '            </div>\n' +
        '        </form>\n' +
        '    </div>\n' +
        '</section>\n' +
        '',
    );
  },
]);

angular.module('alphaStatus.tpl.html', []).run([
  '$templateCache',
  function($templateCache) {
    $templateCache.put(
      'alphaStatus.tpl.html',
      '<section desc="Status">\n' +
        '  <div class="row">\n' +
        '    <form class="col-md-6 col-md-offset-3 col-sm-12">\n' +
        '      <div class="row">\n' +
        '        <h4 class="wrapper-xs text-center alpha-header-text">\n' +
        "          {{'statusHeaderText'|translate}}\n" +
        '        </h4>\n' +
        '        <div class="col-sm-12">\n' +
        '          <div class="panel alpha-panel-default" ng-if="status.show">\n' +
        '            <div class="panel-body">\n' +
        '              <div class="row">\n' +
        '                <span class="col-xs-5 font-bold">{{\'yourIp\' | translate}}</span>\n' +
        '                <span class="col-xs-5 ltr">{{status.ip | persianNumber}}</span>\n' +
        '              </div>\n' +
        '              <div class="row">\n' +
        '                <span class="col-xs-5 font-bold">{{\'download\' | translate}}</span>\n' +
        '                <span class="col-xs-5 ltr">{{status.download | persianNumber}}</span>\n' +
        '              </div>\n' +
        '              <div class="row">\n' +
        '                <span class="col-xs-5 font-bold">{{\'upload\' | translate}}</span>\n' +
        '                <span class="col-xs-5 ltr">{{status.upload | persianNumber}}</span>\n' +
        '              </div>\n' +
        '              <div class="row">\n' +
        '                <span class="col-xs-5 font-bold">{{\'upTime\' | translate}}</span>\n' +
        '                <span class="col-xs-5 ltr">{{status.uptime | persianNumber}}</span>\n' +
        '              </div>\n' +
        '            </div>\n' +
        '          </div>\n' +
        '        </div>\n' +
        '        <div class="form-group text-center">\n' +
        '          <a class="alpha-social-btn" ng-show="showInstagram" href="{{instagram}}">\n' +
        '            <i class="icon-instagram"></i>\n' +
        '          </a>\n' +
        '          <a class="alpha-social-btn" ng-show="showTelegram" href="{{telegram}}">\n' +
        '            <i class="icon-telegram"></i>\n' +
        '          </a>\n' +
        '        </div>\n' +
        '        <div class="form-group">\n' +
        '          <button class="btn alpha-btn btn-block alpha-btn-primary" ng-click="signOut()">{{\'signOutBtn\'| translate}}\n' +
        '          </button>\n' +
        '        </div>\n' +
        '      </div>\n' +
        '    </form>\n' +
        '  </div>\n' +
        '</section>\n' +
        '',
    );
  },
]);

angular.module('alphaVerify.tpl.html', []).run([
  '$templateCache',
  function($templateCache) {
    $templateCache.put(
      'alphaVerify.tpl.html',
      '<section desc="Verification">\n' +
        '  <div class="row">\n' +
        '    <form class="col-md-6 col-md-offset-3 col-sm-12">\n' +
        '      <h4 class="wrapper-xs text-center alpha-header-text">\n' +
        "        {{'enterVerificationCode' | translate}}\n" +
        '      </h4>\n' +
        '      <div class="form-group">\n' +
        '        <input type="text" class="alpha-input form-control text-center dir-ltr"\n' +
        '               placeholder="{{\'verificationCode\'| translate}}"\n' +
        '               ng-model="data.verificationCode" autofocus>\n' +
        '      </div>\n' +
        '      <div class="form-group">\n' +
        '        <button class="btn alpha-btn alpha-btn-primary btn-block" type="submit" ng-click="verify()">{{\'confirm\'| translate}}\n' +
        '        </button>\n' +
        '      </div>\n' +
        '      <div class="form-group">\n' +
        '        <button class="btn btn-block alpha-btn alpha-btn-default" type="button" ng-click="goBack(\'verify\')">\n' +
        "          {{'back' | translate}}\n" +
        '        </button>\n' +
        '      </div>\n' +
        '    </form>\n' +
        '  </div>\n' +
        '</section>\n' +
        '',
    );
  },
]);
