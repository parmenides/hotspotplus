angular.module("hotspotplus.templates", ["app/admin/tpl/signIn.html", "app/common/tpl/areYouSure.html", "app/common/tpl/confirmDialog.html", "app/common/tpl/increaseCreditForm.html", "app/common/tpl/invoices.html", "app/common/tpl/passwordForm.html", "app/common/tpl/paymentResult.html", "app/license/tpl/licenseInfo.html", "app/license/tpl/licenseList.html", "app/license/tpl/licenseModuleForm.html", "app/license/tpl/licenseServiceForm.html"]);

angular.module("app/admin/tpl/signIn.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/admin/tpl/signIn.html",
    "<div class=\"container w-xxl w-auto-xs\" ng-controller=\"AdminSignInController\" ng-init=\"app.settings.container = false;\">\n" +
    "  <a href class=\"navbar-brand block m-t\">{{app.name}}</a>\n" +
    "  <div class=\"m-b-lg\">\n" +
    "    <div class=\"wrapper text-center\">\n" +
    "      <strong>{{\"user.signInTitle\"|translate}}</strong>\n" +
    "    </div>\n" +
    "    <form name=\"form\" class=\"form-validation\">\n" +
    "      <div class=\"text-danger wrapper text-center\" ng-show=\"authError\">\n" +
    "        {{authError}}\n" +
    "      </div>\n" +
    "      <div class=\"list-group list-group-sm\">\n" +
    "        <div class=\"list-group-item\">\n" +
    "          <input type=\"text\" placeholder=\"{{'general.username'|translate}}\" class=\"form-control no-border\" ng-model=\"credential.username\" required>\n" +
    "        </div>\n" +
    "        <div class=\"list-group-item\">\n" +
    "          <input type=\"password\" placeholder=\"{{'general.password'|translate}}\" class=\"form-control no-border\" ng-model=\"credential.password\" required>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "      <button type=\"submit\" class=\"btn btn-lg btn-primary btn-block\" ng-click=\"signIn()\" ng-disabled='form.$invalid'>{{\"user.signIn\"|translate}}</button>\n" +
    "    </form>\n" +
    "  </div>\n" +
    "  <div class=\"text-center\" ng-include=\"'tpl/blocks/page_footer.html'\">\n" +
    "    {% include 'blocks/page_footer.html' %}\n" +
    "  </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/common/tpl/areYouSure.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/common/tpl/areYouSure.html",
    "<div class=\"\">\n" +
    "    <div class=\"modal-header\">\n" +
    "        <h3 class=\"modal-title\">{{ options.title |translate }}</h3>\n" +
    "    </div>\n" +
    "    <div class=\"modal-body\">\n" +
    "        <p>{{ options.message | translate }} </p>\n" +
    "    </div>\n" +
    "    <div class=\"modal-footer\">\n" +
    "        <button ng-click=\"no()\" class=\"btn btn-default\">{{ options.noBtnLabel | translate }}</button>\n" +
    "        <button ng-click=\"yes()\" class=\"btn btn-primary\">{{ options.yesBtnLabel | translate }}</button>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/common/tpl/confirmDialog.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/common/tpl/confirmDialog.html",
    "<div class=\"\">\n" +
    "  <div class=\"modal-header\">\n" +
    "    <h3 class=\"modal-title\">{{ options.title |translate }}</h3>\n" +
    "  </div>\n" +
    "  <div class=\"modal-body\">\n" +
    "    <p>{{ options.message | translate }} </p>\n" +
    "  </div>\n" +
    "  <div class=\"modal-footer\">\n" +
    "    <button ng-click=\"no()\" class=\"btn btn-default\">{{ options.noBtnLabel | translate }}</button>\n" +
    "    <button ng-click=\"yes()\" class=\"btn btn-danger\">{{ options.yesBtnLabel | translate }}</button>\n" +
    "  </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/common/tpl/increaseCreditForm.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/common/tpl/increaseCreditForm.html",
    "<div class=\"\">\n" +
    "    <div class=\"modal-header\">\n" +
    "        <h3 class=\"modal-title\">{{ options.title |translate }}</h3>\n" +
    "    </div>\n" +
    "    <div class=\"modal-body\">\n" +
    "        <fieldset class=\"wrapper-lg\">\n" +
    "            <legend>\n" +
    "                <div class=\"wrapper padding-v text-center\">\n" +
    "                    <h1 class=\"m-n h4 text-primary\">{{options.message | translate}}&nbsp;{{\"general.:\" | translate}}&nbsp;{{ options.balance | translateNumber }}&nbsp;{{\"general.toman\" | translate}}</h1>\n" +
    "                    <h1 class=\"m-n h5 wrapper text-info\" ng-if=\"options.requiredCredit\">{{\"business.requiredCredit\" | translate}}&nbsp;{{\"general.:\" | translate}}&nbsp;{{ options.requiredCredit | translateNumber }}&nbsp;{{\"general.toman\" | translate}}</h1>\n" +
    "                </div>\n" +
    "            </legend>\n" +
    "            <form class=\"form-horizontal\" name=\"creditForm\">\n" +
    "                <!--<div class=\"form-group form-group-md\" ng-if=\"options.requiredCredit\">\n" +
    "                    <label class=\"col-sm-4 control-label\">{{ \"business.requiredCredit\" | translate }}</label>\n" +
    "                    <div class=\"col-sm-7\">\n" +
    "                        {{options.requiredCredit}}\n" +
    "                    </div>\n" +
    "                </div>-->\n" +
    "                <div class=\"form-group form-group-md\">\n" +
    "                    <label class=\"col-sm-4 control-label\">{{ \"business.increaseCreditAmount\" | translate }}</label>\n" +
    "                    <div class=\"col-sm-7\">\n" +
    "                        <div class=\"input-group\">\n" +
    "                            <input ng-model='amount' type=\"text\" class=\"form-control\" name=\"amount\" ng-pattern=\"/^0|[۱-۹1-9][۰-۹0-9]*$/\" required autofocus>\n" +
    "                            <div class=\"input-group-btn\">\n" +
    "                                <button type=\"button\" class=\"btn btn-default\" disabled=\"disabled\">\n" +
    "                                    {{\"general.rial\" | translate}}\n" +
    "                                </button>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "                <div class=\"col-sm-offset-4 text-danger\" ng-show=\"creditForm.amount.$error.pattern\" >{{\"business.notValidAmount\" | translate}}</div>\n" +
    "            </form>\n" +
    "        </fieldset>\n" +
    "    </div>\n" +
    "    <div class=\"modal-footer\">\n" +
    "        <button ng-click=\"cancel()\" class=\"btn btn-sm btn-default\" ng-disabled='bankWait'>{{ options.cancelBtnLabel | translate }}</button>\n" +
    "        <button ng-click=\"payment()\" ng-if='!bankWait' class=\"btn btn-sm btn-primary col-sm-4 pull-right\" ng-disabled='creditForm.$invalid'>\n" +
    "            {{ options.submitBtnLabel | translate }}\n" +
    "        </button>\n" +
    "        <button class=\"btn btn-sm btn-info col-sm-4 pull-right\" ng-if=\"bankWait\" ng-disabled='true'><i class=\"fa fa-circle-o-notch fa-spin\"></i>\n" +
    "            {{ \"business.connectingToBank\" | translate }}\n" +
    "        </button>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/common/tpl/invoices.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/common/tpl/invoices.html",
    "<div class=\"\">\n" +
    "    <div class=\"modal-header\">\n" +
    "        <h3 class=\"modal-title\">{{ options.title |translate }}</h3>\n" +
    "    </div>\n" +
    "    <div class=\"modal-body\">\n" +
    "        <div class=\"pre-scrollable\">\n" +
    "            <div class=\"col wrapper-lg\" ng-if=\"!options.invoices || options.invoices.length == 0\">\n" +
    "                <div uib-alert class=\"alert-danger\">{{\"business.noItemToShow\" | translate}}</div>\n" +
    "            </div>\n" +
    "            <table class=\"table table-hover table-responsive table-condensed text-xs\"\n" +
    "                   ng-if=\"options.invoices && options.invoices.length != 0\">\n" +
    "                <thead>\n" +
    "                <tr>\n" +
    "                    <th>{{\"general.row\" | translate}}</th>\n" +
    "                    <th>{{\"invoice.paymentDate\" | translate}}</th>\n" +
    "                    <th>{{\"invoice.allowedOnlineUsers\" | translate}}</th>\n" +
    "                    <th>{{\"invoice.serviceDuration\" | translate}}</th>\n" +
    "                    <th>{{\"invoice.invoiceType\" | translate}}</th>\n" +
    "                    <th>{{\"invoice.issueDate\" | translate}}</th>\n" +
    "                    <th>{{\"invoice.price\" | translate}}</th>\n" +
    "                    <th>{{\"invoice.payed\" | translate}}</th>\n" +
    "                </tr>\n" +
    "                </thead>\n" +
    "                <tbody>\n" +
    "                <tr ng-repeat=\"invoice in options.invoices | orderBy: '-issueDate'\"\n" +
    "                    ng-class=\"{'success' : invoice.payed == true,'danger' : invoice.payed == false}\">\n" +
    "                    <td>{{$index + 1 | translateNumber}}</td>\n" +
    "                    <td>\n" +
    "                        <span ng-if=\"invoice.paymentDate\">{{invoice.paymentDate | persianDate : \"fullDate\" | translateNumber}}</span>\n" +
    "                        <span ng-if=\"!invoice.paymentDate\">-</span>\n" +
    "                    </td>\n" +
    "                    <td>\n" +
    "                        <span ng-if=\"invoice.allowedOnlineUsers\">{{invoice.allowedOnlineUsers | translateNumber}}&nbsp;{{'general.person' | translate}}</span>\n" +
    "                        <span ng-if=\"!invoice.allowedOnlineUsers\">-</span>\n" +
    "                    </td>\n" +
    "                    <td>\n" +
    "                        <span ng-if=\"invoice.durationInMonths\">{{invoice.durationInMonths | translateNumber}}&nbsp;{{'general.month' | translate}}</span>\n" +
    "                        <span ng-if=\"!invoice.durationInMonths\">-</span>\n" +
    "                    </td>\n" +
    "                    <td>{{\"invoice.\"+invoice.invoiceType | translate}}</td>\n" +
    "                    <td>{{invoice.issueDate | persianDate : \"fullDate\" | translateNumber}}</td>\n" +
    "                    <td><span style=\"direction: ltr\">{{invoice.price | translateNumber}}</span>&nbsp;{{\"general.toman\"\n" +
    "                        | translate}}\n" +
    "                    </td>\n" +
    "                    <td><span ng-if=\"invoice.payed == true\">{{'invoice.payedTrue' | translate}}</span>\n" +
    "                        <span ng-if=\"invoice.payed == false\">{{'invoice.payedFalse' | translate}}</span>\n" +
    "                    </td>\n" +
    "                </tr>\n" +
    "                </tbody>\n" +
    "            </table>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "<div class=\"modal-footer\">\n" +
    "    <button ng-click=\"ok()\" class=\"btn btn-sm btn-primary\">{{ options.okBtnLabel | translate }}</button>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/common/tpl/passwordForm.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/common/tpl/passwordForm.html",
    "<div class=\"\">\n" +
    "    <div class=\"modal-header\">\n" +
    "        <h3 class=\"modal-title\">{{ options.title |translate }}</h3>\n" +
    "    </div>\n" +
    "<!--todo : password show/hide -->\n" +
    "\n" +
    "    <div class=\"modal-body\">\n" +
    "        <form class=\"form-horizontal\" name=\"passwordForm\" novalidate>\n" +
    "            <div class=\"form-group has-feedback\"\n" +
    "                 ng-class=\"{ 'has-error' : passwordForm.currentPassword.$error.required }\">\n" +
    "                <label class=\"col-sm-3 control-label\">{{ \"general.currentPassword\" | translate }}</label>\n" +
    "                <div class=\"col-sm-8 \">\n" +
    "                    <input ng-model=\"currentPassword\" type=\"{{showCurrentPassword ? 'text' : 'password'}}\"\n" +
    "                           class=\"form-control\" name=\"currentPassword\" required>\n" +
    "                    <div ng-show=\"passwordForm.currentPassword.$error.required\">\n" +
    "                        {{\"general.requiredCurrentPassword\" | translate}}\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div class=\"form-group\" ng-class=\"{ 'has-error' : passwordForm.password.$error.required }\">\n" +
    "                <label class=\"col-sm-3 control-label\">{{ \"general.newPassword\" | translate }}</label>\n" +
    "                <div class=\"col-sm-8\">\n" +
    "                    <input ng-model='password' type=\"{{showPassword ? 'text' : 'password'}}\" class=\"form-control\"\n" +
    "                           name=\"password\" required>\n" +
    "\n" +
    "                    <div ng-show=\"passwordForm.password.$error.required\">\n" +
    "                        {{\"general.requiredNewPassword\" | translate}}\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </form>\n" +
    "    </div>\n" +
    "    <div class=\"modal-footer\">\n" +
    "        <button ng-click=\"cancel()\" class=\"btn btn-sm btn-default\">{{ options.cancelBtnLabel | translate }}</button>\n" +
    "        <button ng-click=\"save()\" class=\"btn btn-sm btn-primary\" ng-disabled='passwordForm.$invalid'>\n" +
    "            {{ options.saveBtnLabel | translate }}\n" +
    "        </button>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/common/tpl/paymentResult.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/common/tpl/paymentResult.html",
    "<div class=\"\">\n" +
    "    <div class=\"modal-header\">\n" +
    "        <h3 class=\"modal-title  text-danger\" ng-if=\"options.payed == 'false'\">{{ \"business.operationError\" |translate }}</h3>\n" +
    "        <h3 class=\"modal-title\" ng-if=\"options.payed == 'true'\">{{ \"business.operationSuccess\" |translate }}</h3>\n" +
    "    </div>\n" +
    "    <div class=\"modal-body\">\n" +
    "                <div class=\"wrapper padding-v text-center\">\n" +
    "                    <h1 class=\"m-n h4\" ng-if=\"options.payed == 'false'\">{{ \"business.operationErrorContactSupport\" |translate }}</h1>\n" +
    "                    <h1 class=\"m-n h4\" ng-if=\"options.payed == 'true'\">{{ \"business.operationSuccessful\" |translate }}</h1>\n" +
    "                </div>\n" +
    "    </div>\n" +
    "    <div class=\"modal-footer\">\n" +
    "        <button ng-click=\"ok()\" class=\"btn btn-sm btn-danger col-sm-4 pull-right\" ng-if=\"options.payed == 'false'\">{{ \"general.gotIt\" | translate }}</button>\n" +
    "        <button ng-click=\"ok()\" class=\"btn btn-sm btn-primary col-sm-4 pull-right\" ng-if=\"options.payed == 'true'\">{{ \"general.close\" | translate }}</button>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/license/tpl/licenseInfo.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/license/tpl/licenseInfo.html",
    "<div class=\"\">\n" +
    "    <div class=\"\">\n" +
    "        <div class=\"modal-header\">\n" +
    "            <h3 class=\"modal-title\">{{ 'license.info' |translate }}</h3>\n" +
    "        </div>\n" +
    "        <div class=\"modal-body\">\n" +
    "            <div class=\"wrapper\">\n" +
    "                <div class=\"row\">\n" +
    "                    <div class=\"row\">\n" +
    "                        <div class=\"col-sm-4\">\n" +
    "                            {{\"general.title\" |translate}}:\n" +
    "                        </div>\n" +
    "                        <div class=\"col-sm-6\">\n" +
    "                            {{ license.title}}\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                    <hr>\n" +
    "                    <div class=\"row\">\n" +
    "                        <div class=\"col-sm-4\">\n" +
    "                            {{\"Application Version\" |translate}}:\n" +
    "                        </div>\n" +
    "                        <div class=\"col-sm-6\">\n" +
    "                            {{ license.applicationVersion}}\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                    <hr>\n" +
    "                    <div class=\"row\">\n" +
    "                        <div class=\"col-sm-4\">\n" +
    "                            {{\"Web App Address\"}}:\n" +
    "                        </div>\n" +
    "                        <div class=\"col-sm-6\">\n" +
    "                            {{ license.webAppAddress}}\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                    <hr>\n" +
    "                    <div class=\"row\">\n" +
    "                        <div class=\"col-sm-4\">\n" +
    "                            {{\"External Api Address\"}}:\n" +
    "                        </div>\n" +
    "                        <div class=\"col-sm-6\">\n" +
    "                            {{ license.externalApiAddress}}\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                    <hr>\n" +
    "                    <div class=\"row\">\n" +
    "                        <div class=\"col-sm-4\">\n" +
    "                            {{\"System Uuid\"}}:\n" +
    "                        </div>\n" +
    "                        <div class=\"col-sm-6\">\n" +
    "                            {{ license.systemUuid}}\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                    <hr>\n" +
    "\n" +
    "                    <div class=\"row\">\n" +
    "                        <div class=\"col-sm-4\">\n" +
    "                            {{\"general.mobile\" |translate}}:\n" +
    "                        </div>\n" +
    "                        <div class=\"col-sm-6\">\n" +
    "                            {{ license.mobile}}\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                    <hr>\n" +
    "                    <div class=\"row\">\n" +
    "                        <div class=\"col-sm-12\">\n" +
    "                            {{\"general.package\" |translate}}:{{ license.services.id}}\n" +
    "                        </div>\n" +
    "                        <div class=\"col-sm-12\">\n" +
    "                            {{\"license.subscriptionDate\" |translate}}:{{ license.services.subscriptionDate |\n" +
    "                            persianDate:'fullDate'|translateNumber }}\n" +
    "                        </div>\n" +
    "                        <div class=\"col-sm-12\">\n" +
    "                            {{\"license.allowedOnlineUsers\" |translate}}:{{ license.services.allowedOnlineUsers\n" +
    "                            |translateNumber }}\n" +
    "                        </div>\n" +
    "                        <div class=\"col-sm-12\">\n" +
    "                            {{\"license.expiresAt\" |translate}}:{{ license.services.expiresAt |\n" +
    "                            persianDate:'fullDate'|translateNumber }}\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                    <hr>\n" +
    "\n" +
    "                    <div ng-repeat=\"module in license.modules\">\n" +
    "                        <div class=\"row\">\n" +
    "                            <div class=\"col-sm-12\">\n" +
    "                                {{\"license.module\" |translate}}:{{ module.id}}\n" +
    "                            </div>\n" +
    "                            <div class=\"col-sm-12\">\n" +
    "                                {{\"license.subscriptionDate\" |translate}}: {{ module.subscriptionDate |\n" +
    "                                persianDate:'fullDate'|translateNumber }}\n" +
    "                            </div>\n" +
    "                            <div class=\"col-sm-12\">\n" +
    "                                <span>\n" +
    "                                    {{\"license.expiresAt\" |translate}}: {{ module.expiresAt | persianDate:'fullDate'|translateNumber }}\n" +
    "                                </span>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                        <hr>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div class=\"modal-footer\">\n" +
    "        <button ng-click=\"cancel()\" class=\"btn btn-sm btn-default\">{{ \"general.close\" | translate }}</button>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/license/tpl/licenseList.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/license/tpl/licenseList.html",
    "<div ng-controller=\"licenseList\">\n" +
    "    <div class=\"wrapper-md bg-light b-b\">\n" +
    "        <h1 class=\"m-n font-thin h3\">{{\"license.listTitle\"|translate}}</h1>\n" +
    "    </div>\n" +
    "    <div class=\"hbox hbox-auto-xs hbox-auto-sm\">\n" +
    "        <div class=\"col wrapper-md\">\n" +
    "            <div class=\"row\">\n" +
    "                <div class=\"clearfix m-b \">\n" +
    "                    <form class=\"\" ng-submit=\"searchLicense()\">\n" +
    "                        <div class=\"col-sm-3\">\n" +
    "                            <input type=\"text\" class=\"form-control input-sm\" ng-model=\"licenseId\"\n" +
    "                                   placeholder=\"{{'license.inputId' |  translate}}\"\n" +
    "                                   popover-placement=\"bottom-right\">\n" +
    "                        </div>\n" +
    "                    </form>\n" +
    "                    <form class=\"\" ng-submit=\"searchLicense()\">\n" +
    "                        <div class=\"col-sm-3\">\n" +
    "                            <input type=\"text\" class=\"form-control input-sm\" ng-model=\"serviceProviderId\"\n" +
    "                                   placeholder=\"{{'license.serviceProviderId' |  translate}}\"\n" +
    "                                   popover-placement=\"bottom-right\">\n" +
    "                        </div>\n" +
    "                    </form>\n" +
    "                    <button type=\"button\" class=\"btn btn-sm btn-primary\" ng-if=\"!isSearching\"\n" +
    "                            ng-click=\"searchLicense()\"\n" +
    "                            uib-popover=\"{{'help.searchLicense' | translate}}\" popover-trigger=\"mouseenter\"\n" +
    "                            popover-placement=\"bottom-right\">\n" +
    "                        <i class=\"fa fa-search\"></i>\n" +
    "                    </button>\n" +
    "                    <button type=\"button\" class=\"btn btn-sm btn-info\"\n" +
    "                            uib-popover=\"{{'help.isSearching' | translate}}\" popover-trigger=\"mouseenter\"\n" +
    "                            popover-placement=\"bottom-right\"\n" +
    "                            ng-if=\"isSearching\" disabled>\n" +
    "                        <i class=\"fa fa-circle-o-notch fa-spin\"></i>\n" +
    "                    </button>\n" +
    "                    <button type=\"button\" class=\"btn btn-sm btn-default\"\n" +
    "                            uib-popover=\"{{'help.clear' | translate}}\" popover-trigger=\"mouseenter\" popover-placement=\"left\"\n" +
    "                            ng-click=\"clearSearch()\">\n" +
    "                        <i class=\"fa fa-close\"></i>\n" +
    "                    </button>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div class=\"table-responsive m-b-lg\">\n" +
    "                <div ui-i18n=\"{{localLang}}\">\n" +
    "                    <div ui-grid=\"gridOptions\" ui-grid-pagination ui-grid-resize-columns class=\"grid\"\n" +
    "                         dir=\"{{direction}}\"></div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div class=\"row\">\n" +
    "                <div class=\"col-md-5\">\n" +
    "                    <div class=\"btn-group\">\n" +
    "                        <label class=\"btn btn-default\" ng-model=\"paginationOptions.itemPerPage\" uib-btn-radio=\"10\"\n" +
    "                               uncheckable>{{10 | translateNumber}}</label>\n" +
    "                        <label class=\"btn btn-default\" ng-model=\"paginationOptions.itemPerPage\" uib-btn-radio=\"20\"\n" +
    "                               uncheckable>{{20 | translateNumber}}</label>\n" +
    "                        <label class=\"btn btn-default\" ng-model=\"paginationOptions.itemPerPage\" uib-btn-radio=\"40\"\n" +
    "                               uncheckable>{{40 | translateNumber}}</label>\n" +
    "                        <label class=\"btn btn-default\" ng-model=\"paginationOptions.itemPerPage\" uib-btn-radio=\"60\"\n" +
    "                               uncheckable>{{60 | translateNumber}}</label>\n" +
    "                        <label class=\"btn btn-default\" ng-model=\"paginationOptions.itemPerPage\" uib-btn-radio=\"80\"\n" +
    "                               uncheckable>{{80 | translateNumber}}</label>\n" +
    "                        <label class=\"btn btn-default\" ng-model=\"paginationOptions.itemPerPage\" uib-btn-radio=\"100\"\n" +
    "                               uncheckable>{{100 | translateNumber}}</label>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "                <div class=\"col-md-6\">\n" +
    "                    <uib-pagination ng-change=\"pageChanges()\"\n" +
    "                                    total-items=\"paginationOptions.totalItems\"\n" +
    "                                    items-per-page=\"paginationOptions.itemPerPage\"\n" +
    "                                    previous-text=\"{{'general.previous'|translate}}\"\n" +
    "                                    next-text=\"{{'general.next'|translate}}\"\n" +
    "                                    class=\"pagination-md\"\n" +
    "                                    ng-model=\"paginationOptions.pageNumber\"\n" +
    "                                    boundary-link-numbers=\"true\" rotate=\"false\" max-size=\"5\"></uib-pagination>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/license/tpl/licenseModuleForm.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/license/tpl/licenseModuleForm.html",
    "<div class=\"\">\n" +
    "    <div class=\"modal-header\">\n" +
    "        <h3 class=\"modal-title\">{{ \"license.assignModule\" |translate }}</h3>\n" +
    "    </div>\n" +
    "    <div class=\"modal-body\">\n" +
    "        <div class=\"wrapper\">\n" +
    "            <form class=\"form-horizontal\" name=\"businessForm\">\n" +
    "                <div class=\"form-group\">\n" +
    "                    <label class=\"col-sm-4 control-label\">\n" +
    "                        {{ \"business.packageId\" | translate }}</label>\n" +
    "                    <div class=\"col-sm-7\">\n" +
    "                        <select ng-model=\"moduleItem.id\" class=\"form-control\">\n" +
    "                            <option value=\"sms\">{{'SMS' | translate}}</option>\n" +
    "                            <option value=\"log\">{{'Log' | translate}}</option>\n" +
    "                        </select>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "                <div class=\"form-group\">\n" +
    "                    <label class=\"col-sm-4 control-label\">\n" +
    "                        {{ \"business.serviceStartDate\" | translate }}</label>\n" +
    "                    <div class=\"col-sm-7\">\n" +
    "                        <div class=\"input-group input-group-sm calender-container\">\n" +
    "                            <input type=\"text\" class=\"text-center form-control\"\n" +
    "                                   datepicker-popup-persian='{{dateFormat}}' ng-model=\"moduleItem.subscriptionDate\"\n" +
    "                                   is-open=\"calendarIsOpen\" datepicker-options=\"dateOptions\"\n" +
    "                                   close-text=\"{{ 'date.close' | translate }}\"/>\n" +
    "                            <span class=\"input-group-btn\">\n" +
    "                            <button type=\"button\" class=\"btn btn-primary\"\n" +
    "                                    ng-click=\"selectDate($event)\">\n" +
    "                                <i class=\"fa fa-calendar\"></i>\n" +
    "                            </button>\n" +
    "                        </span>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "                <div class=\"form-group\">\n" +
    "                    <label class=\"col-sm-4 control-label\">\n" +
    "                        {{ \"business.selectDuration\" | translate }}</label>\n" +
    "                    <div class=\"col-sm-7\">\n" +
    "                        <div class=\"input-group\">\n" +
    "                            <input type=\"text\" class=\"form-control\"\n" +
    "                                   ng-model=\"moduleItem.durationInMonths\" required>\n" +
    "                            <div class=\"input-group-btn\">\n" +
    "                                <button type=\"button\" class=\"btn btn-default\" disabled=\"disabled\">\n" +
    "                                    {{\"general.month\" | translate}}\n" +
    "                                </button>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </form>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div class=\"modal-footer\">\n" +
    "        <button ng-click=\"cancel()\" class=\"btn btn-sm btn-default\">{{ \"general.close\" | translate }}</button>\n" +
    "        <button ng-click=\"save()\" class=\"btn btn-sm btn-primary\">{{ \"general.save\" |\n" +
    "            translate }}\n" +
    "        </button>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/license/tpl/licenseServiceForm.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/license/tpl/licenseServiceForm.html",
    "<div class=\"\">\n" +
    "    <div class=\"modal-header\">\n" +
    "        <h3 class=\"modal-title\">{{ \"license.assignService\" |translate }}</h3>\n" +
    "    </div>\n" +
    "    <div class=\"modal-body\">\n" +
    "        <div class=\"wrapper\">\n" +
    "            <form class=\"form-horizontal\" name=\"businessForm\">\n" +
    "\n" +
    "                <div class=\"form-group\">\n" +
    "                    <label class=\"col-sm-4 control-label\">\n" +
    "                        {{ \"business.serviceStartDate\" | translate }}</label>\n" +
    "                    <div class=\"col-sm-7\">\n" +
    "                        <div class=\"input-group input-group-sm calender-container\">\n" +
    "                            <input type=\"text\" class=\"text-center form-control\"\n" +
    "                                   datepicker-popup-persian='{{dateFormat}}' ng-model=\"moduleItem.subscriptionDate\"\n" +
    "                                   is-open=\"calendarIsOpen\" datepicker-options=\"dateOptions\"\n" +
    "                                   close-text=\"{{ 'date.close' | translate }}\"/>\n" +
    "                            <span class=\"input-group-btn\">\n" +
    "                            <button type=\"button\" class=\"btn btn-primary\"\n" +
    "                                    ng-click=\"selectDate($event)\">\n" +
    "                                <i class=\"fa fa-calendar\"></i>\n" +
    "                            </button>\n" +
    "                        </span>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "                <div class=\"form-group\">\n" +
    "                    <label class=\"col-sm-4 control-label\">\n" +
    "                        {{ \"business.selectDuration\" | translate }}</label>\n" +
    "                    <div class=\"col-sm-7\">\n" +
    "                        <div class=\"input-group\">\n" +
    "                            <input type=\"text\" class=\"form-control\"\n" +
    "                                   ng-model=\"moduleItem.durationInMonths\" required>\n" +
    "                            <div class=\"input-group-btn\">\n" +
    "                                <button type=\"button\" class=\"btn btn-default\" disabled=\"disabled\">\n" +
    "                                    {{\"general.month\" | translate}}\n" +
    "                                </button>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div> <div class=\"form-group\">\n" +
    "                    <label class=\"col-sm-4 control-label\">\n" +
    "                        {{ \"license.allowedOnlineUsers\" | translate }}</label>\n" +
    "                    <div class=\"col-sm-7\">\n" +
    "                        <div class=\"input-group\">\n" +
    "                            <input type=\"text\" class=\"form-control\"\n" +
    "                                   ng-model=\"moduleItem.allowedOnlineUsers\" required>\n" +
    "                            <div class=\"input-group-btn\">\n" +
    "                                <button type=\"button\" class=\"btn btn-default\" disabled=\"disabled\">\n" +
    "                                    {{\"general.month\" | translate}}\n" +
    "                                </button>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </form>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div class=\"modal-footer\">\n" +
    "        <button ng-click=\"cancel()\" class=\"btn btn-sm btn-default\">{{ \"general.close\" | translate }}</button>\n" +
    "        <button ng-click=\"save()\" class=\"btn btn-sm btn-primary\">{{ \"general.save\" |\n" +
    "            translate }}\n" +
    "        </button>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);
