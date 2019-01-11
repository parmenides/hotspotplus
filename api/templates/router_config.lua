local SERVER_ADDRESS = "http://192.168.1.166:3000/splashpage/";
local CHILLI_WEB_DIRECTORY = "/tmp/chilli/www";
pinFiConfig = {
    {
        sh = "mkdir -p /tmp/chilli/www/bower_components/OnsenUI/css/",
        path = CHILLI_WEB_DIRECTORY .. "/bower_components/OnsenUI/css/onsenui.css",
        url = SERVER_ADDRESS .. "bower_components/OnsenUI/css/onsenui.css"
    },
    {
        sh = "mkdir -p /tmp/chilli/www/img/",
        path = CHILLI_WEB_DIRECTORY .. "/img/logo.png",
        url = SERVER_ADDRESS .. "/img/logo.png"
    },
    {
        path = CHILLI_WEB_DIRECTORY .. "/bower_components/OnsenUI/css/onsen-css-components.css",
        url = SERVER_ADDRESS .. "bower_components/OnsenUI/css/onsen-css-components.css"
    },
    {
        sh = "mkdir -p /tmp/chilli/www/bower_components/OnsenUI/css/font_awesome/css/",
        path = CHILLI_WEB_DIRECTORY .. "/bower_components/OnsenUI/css/font_awesome/css/font-awesome.min.css",
        url = SERVER_ADDRESS .. "bower_components/OnsenUI/css/font_awesome/css/font-awesome.min.css"
    },
    {
        sh = "mkdir -p /tmp/chilli/www/bower_components/OnsenUI/css/ionicons/css/",
        path = CHILLI_WEB_DIRECTORY .. "/bower_components/OnsenUI/css/ionicons/css/ionicons.min.css",
        url = SERVER_ADDRESS .. "bower_components/OnsenUI/css/ionicons/css/ionicons.min.css"
    },
    {
        sh = "mkdir -p /tmp/chilli/www/bower_components/OnsenUI/css/font_awesome/fonts/",
        path = CHILLI_WEB_DIRECTORY .. "/bower_components/OnsenUI/css/font_awesome/fonts/fontawesome-webfont.woff2",
        url = SERVER_ADDRESS .. "bower_components/OnsenUI/css/font_awesome/fonts/fontawesome-webfont.woff2"
    },
    {
        path = CHILLI_WEB_DIRECTORY .. "/bower_components/OnsenUI/css/font_awesome/fonts/fontawesome-webfont.woff",
        url = SERVER_ADDRESS .. "bower_components/OnsenUI/css/font_awesome/fonts/fontawesome-webfont.woff"
    },
    {
        path = CHILLI_WEB_DIRECTORY .. "/bower_components/OnsenUI/css/font_awesome/fonts/fontawesome-webfont.ttf",
        url = SERVER_ADDRESS .. "bower_components/OnsenUI/css/font_awesome/fonts/fontawesome-webfont.ttf"
    },
    {
        path = CHILLI_WEB_DIRECTORY .. "/bower_components/OnsenUI/css/font_awesome/fonts/fontawesome-webfont.svg",
        url = SERVER_ADDRESS .. "bower_components/OnsenUI/css/font_awesome/fonts/fontawesome-webfont.svg"
    },
    {
        path = CHILLI_WEB_DIRECTORY .. "/bower_components/OnsenUI/css/font_awesome/fonts/fontawesome-webfont.eot",
        url = SERVER_ADDRESS .. "bower_components/OnsenUI/css/font_awesome/fonts/fontawesome-webfont.eot"
    },
    {
        path = CHILLI_WEB_DIRECTORY .. "/bower_components/OnsenUI/css/font_awesome/fonts/FontAwesome.otf",
        url = SERVER_ADDRESS .. "bower_components/OnsenUI/css/font_awesome/fonts/FontAwesome.otf"
    },
    {
        sh = "mkdir -p /tmp/chilli/www/bower_components/OnsenUI/css/material-design-iconic-font/css/",
        path = CHILLI_WEB_DIRECTORY .. "/bower_components/OnsenUI/css/material-design-iconic-font/css/material-design-iconic-font.min.css",
        url = SERVER_ADDRESS .. "bower_components/OnsenUI/css/material-design-iconic-font/css/material-design-iconic-font.min.css"
    },
    {
        sh = "mkdir -p /tmp/chilli/www/css/",
        path = CHILLI_WEB_DIRECTORY .. "/css/bootstrap.min.css",
        url = SERVER_ADDRESS .. "css/bootstrap.min.css"
    },
    { path = CHILLI_WEB_DIRECTORY .. "/css/bootstrap.css.map", url = SERVER_ADDRESS .. "css/bootstrap.css.map" },
    { path = CHILLI_WEB_DIRECTORY .. "/css/bootstrap-rtl.min.css", url = SERVER_ADDRESS .. "css/bootstrap-rtl.min.css" },
    { path = CHILLI_WEB_DIRECTORY .. "/css/fontiran.css", url = SERVER_ADDRESS .. "css/fontiran.css" },
    { path = CHILLI_WEB_DIRECTORY .. "/css/main.css", url = SERVER_ADDRESS .. "css/main.css" },
    { sh = "mkdir -p /tmp/chilli/www/fonts/eot/", path = CHILLI_WEB_DIRECTORY .. "/fonts/eot/IRANSansWeb.eot", url = SERVER_ADDRESS .. "fonts/eot/IRANSansWeb.eot" },
    { path = CHILLI_WEB_DIRECTORY .. "/fonts/eot/IRANSansWeb_Bold.eot", url = SERVER_ADDRESS .. "fonts/eot/IRANSansWeb_Bold.eot" },
    { path = CHILLI_WEB_DIRECTORY .. "/fonts/eot/IRANSansWeb_Light.eot", url = SERVER_ADDRESS .. "fonts/eot/IRANSansWeb_Light.eot" },
    { path = CHILLI_WEB_DIRECTORY .. "/fonts/eot/IRANSansWeb_Medium.eot", url = SERVER_ADDRESS .. "fonts/eot/IRANSansWeb_Medium.eot" },
    { path = CHILLI_WEB_DIRECTORY .. "/fonts/eot/IRANSansWeb_UltraLight.eot", url = SERVER_ADDRESS .. "fonts/eot/IRANSansWeb_UltraLight.eot" },
    { sh = "mkdir -p /tmp/chilli/www/fonts/ttf/", path = CHILLI_WEB_DIRECTORY .. "/fonts/ttf/IRANSansWeb.ttf", url = SERVER_ADDRESS .. "fonts/ttf/IRANSansWeb.ttf" },
    { path = CHILLI_WEB_DIRECTORY .. "/fonts/ttf/IRANSansWeb_Bold.ttf", url = SERVER_ADDRESS .. "fonts/ttf/IRANSansWeb_Bold.ttf" },
    { path = CHILLI_WEB_DIRECTORY .. "/fonts/ttf/IRANSansWeb_Light.ttf", url = SERVER_ADDRESS .. "fonts/ttf/IRANSansWeb_Light.ttf" },
    { path = CHILLI_WEB_DIRECTORY .. "/fonts/ttf/IRANSansWeb_Medium.ttf", url = SERVER_ADDRESS .. "fonts/ttf/IRANSansWeb_Medium.ttf" },
    { path = CHILLI_WEB_DIRECTORY .. "/fonts/ttf/IRANSansWeb_UltraLight.ttf", url = SERVER_ADDRESS .. "fonts/ttf/IRANSansWeb_UltraLight.ttf" },
    { sh = "mkdir -p /tmp/chilli/www/fonts/woff/", path = CHILLI_WEB_DIRECTORY .. "/fonts/woff/IRANSansWeb.woff", url = SERVER_ADDRESS .. "fonts/woff/IRANSansWeb.woff" },
    { path = CHILLI_WEB_DIRECTORY .. "/fonts/woff/IRANSansWeb_Bold.woff", url = SERVER_ADDRESS .. "fonts/woff/IRANSansWeb_Bold.woff" },
    { path = CHILLI_WEB_DIRECTORY .. "/fonts/woff/IRANSansWeb_Light.woff", url = SERVER_ADDRESS .. "fonts/woff/IRANSansWeb_Light.woff" },
    { path = CHILLI_WEB_DIRECTORY .. "/fonts/woff/IRANSansWeb_Medium.woff", url = SERVER_ADDRESS .. "fonts/woff/IRANSansWeb_Medium.woff" },
    { path = CHILLI_WEB_DIRECTORY .. "/fonts/woff/IRANSansWeb_UltraLight.woff", url = SERVER_ADDRESS .. "fonts/woff/IRANSansWeb_UltraLight.woff" },
    { sh = "mkdir -p /tmp/chilli/www/fonts/woff2/", path = CHILLI_WEB_DIRECTORY .. "/fonts/woff2/IRANSansWeb.woff", url = SERVER_ADDRESS .. "fonts/woff2/IRANSansWeb.woff2" },
    { path = CHILLI_WEB_DIRECTORY .. "/fonts/woff2/IRANSansWeb_Bold.woff2", url = SERVER_ADDRESS .. "fonts/woff2/IRANSansWeb_Bold.woff2" },
    { path = CHILLI_WEB_DIRECTORY .. "/fonts/woff2/IRANSansWeb_Light.woff2", url = SERVER_ADDRESS .. "fonts/woff2/IRANSansWeb_Light.woff2" },
    { path = CHILLI_WEB_DIRECTORY .. "/fonts/woff2/IRANSansWeb_Medium.woff2", url = SERVER_ADDRESS .. "fonts/woff2/IRANSansWeb_Medium.woff2" },
    { path = CHILLI_WEB_DIRECTORY .. "/fonts/woff2/IRANSansWeb_UltraLight.woff2", url = SERVER_ADDRESS .. "fonts/woff2/IRANSansWeb_UltraLight.woff2" },
    { path = CHILLI_WEB_DIRECTORY .. "/fonts/glyphicons-halflings-regular.eot", url = SERVER_ADDRESS .. "fonts/glyphicons-halflings-regular.eot" },
    { path = CHILLI_WEB_DIRECTORY .. "/fonts/glyphicons-halflings-regular.svg", url = SERVER_ADDRESS .. "fonts/glyphicons-halflings-regular.svg" },
    { path = CHILLI_WEB_DIRECTORY .. "/fonts/glyphicons-halflings-regular.ttf", url = SERVER_ADDRESS .. "fonts/glyphicons-halflings-regular.ttf" },
    { path = CHILLI_WEB_DIRECTORY .. "/fonts/glyphicons-halflings-regular.woff", url = SERVER_ADDRESS .. "fonts/glyphicons-halflings-regular.woff" },
    {
        sh = "mkdir -p /tmp/chilli/www/bower_components/angular/",
        path = CHILLI_WEB_DIRECTORY .. "/bower_components/angular/angular.min.js",
        url = SERVER_ADDRESS .. "bower_components/angular/angular.min.js"
    },
    {
        sh = "mkdir -p /tmp/chilli/www/bower_components/angular-translate/",
        path = CHILLI_WEB_DIRECTORY .. "/bower_components/angular-translate/angular-translate.min.js",
        url = SERVER_ADDRESS .. "bower_components/angular-translate/angular-translate.min.js"
    },
    {
        sh = "mkdir -p /tmp/chilli/www/bower_components/OnsenUI/js/",
        path = CHILLI_WEB_DIRECTORY .. "/bower_components/OnsenUI/js/onsenui.min.js",
        url = SERVER_ADDRESS .. "bower_components/OnsenUI/js/onsenui.min.js"
    },
    {
        path = CHILLI_WEB_DIRECTORY .. "/bower_components/OnsenUI/js/angular-onsenui.min.js",
        url = SERVER_ADDRESS .. "bower_components/OnsenUI/js/angular-onsenui.min.js"
    },
    { sh = "mkdir -p /tmp/chilli/www/js/vendor/", path = CHILLI_WEB_DIRECTORY .. "/js/vendor/br.min.js", url = SERVER_ADDRESS .. "js/vendor/br.min.js" },
    { path = CHILLI_WEB_DIRECTORY .. "/js/vendor/chilliController.js", url = SERVER_ADDRESS .. "js/vendor/chilliController.js" },
    { path = CHILLI_WEB_DIRECTORY .. "/js/vendor/ChilliLibrary.js", url = SERVER_ADDRESS .. "js/vendor/ChilliLibrary.js" },
    { path = CHILLI_WEB_DIRECTORY .. "/js/app.js", url = SERVER_ADDRESS .. "js/app.js" },
    { path = CHILLI_WEB_DIRECTORY .. "/index.html", url = SERVER_ADDRESS .. "index.html" },
    { path = CHILLI_WEB_DIRECTORY .. "/mobileSignup.html", url = SERVER_ADDRESS .. "mobileSignup.html" }
};