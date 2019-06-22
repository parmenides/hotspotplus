/**
 * Created by hamidehnouri on 10/10/2016 AD.
 */

app.filter('persianNumber', function() {
  return persianNumber;
});

function persianNumber(value) {
  value = String(value);
  if (!value) return '';
  var s = value.toString();
  s = s
    .replace(/1/g, '۱')
    .replace(/2/g, '۲')
    .replace(/3/g, '۳')
    .replace(/4/g, '۴')
    .replace(/5/g, '۵')
    .replace(/6/g, '۶')
    .replace(/7/g, '۷')
    .replace(/8/g, '۸')
    .replace(/9/g, '۹')
    .replace(/0/g, '۰')
    .replace(/,/g, '،');
  return s;
}

app.filter('englishNumber', function() {
  return englishNumber;
});

function englishNumber(value) {
  value = String(value);
  if (!value) return '';
  var s = value.toString();
  s = s
    .replace(/۱/g, '1')
    .replace(/۲/g, '2')
    .replace(/۳/g, '3')
    .replace(/۴/g, '4')
    .replace(/۵/g, '5')
    .replace(/۶/g, '6')
    .replace(/۷/g, '7')
    .replace(/۸/g, '8')
    .replace(/۹/g, '9')
    .replace(/۰/g, '0')
    .replace(/،/g, ',');
  return s;
}

app.filter('translateNumber', [
  '$translate',
  function($translate) {
    return function(value) {
      var locale = $translate.use();
      if (locale == 'en') {
        return englishNumber(value);
      } else {
        return persianNumber(value);
      }
    };
  }
]);

app.filter('getDay', [
  '$translate',
  function($translate) {
    return function(epoch) {
      var date = new Date(Number(epoch));
      var locale = $translate.use();
      if (locale == 'en') {
        return date.getDate();
      } else {
        return date.getJalaliDate();
      }
    };
  }
]);

app.filter('getMonth', [
  '$translate',
  function($translate) {
    return function(epoch) {
      var date = new Date(Number(epoch));
      var locale = $translate.use();
      if (locale == 'en') {
        return date.getMonth() + 1;
      } else {
        return date.getJalaliMonth();
      }
    };
  }
]);

app.filter('getMonthName', [
  '$translate',
  'translateFilter',
  function($translate, translateFilter) {
    return function(epoch) {
      var date = new Date(Number(epoch));
      var locale = $translate.use();
      if (locale == 'en') {
        return translateFilter(date.getMonth() + 1 + '-month');
      } else {
        return translateFilter(date.getJalaliMonth() + 1 + '-month');
      }
    };
  }
]);

app.filter('getYear', [
  '$translate',
  function($translate) {
    return function(epoch) {
      var date = new Date(Number(epoch));
      var locale = $translate.use();
      if (locale == 'en') {
        return date.getFullYear();
      } else {
        return date.getJalaliFullYear();
      }
    };
  }
]);

app.filter('translateDate', [
  '$translate',
  'PersianDateService',
  function($translate,PersianDateService) {
    return function(epoch) {
      var date = new Date(Number(epoch));
      var locale = $translate.use();
      if (locale === 'en') {
        return (
          date.getFullYear() +
          '/' +
          (date.getMonth() + 1) +
          '/' +
          date.getDate()
        );
      } else {
        return PersianDateService.getFullYear(date) +'/'+ (PersianDateService.getMonth(date) + 1) + '/'   + PersianDateService.getDate(date);
      }
    };
  }
]);
app.filter('trimUsername', [
  'usernameService',
  function(usernameService) {
    return function(username) {
      return usernameService.trim(username);
    };
  }
]);

app.filter('humanSize', [
  function() {
    return function(size) {
      if(size===undefined || size===null){
        size = 0;
      }
      return numeral(size).format('0.000 b')
    };
  }
]);
