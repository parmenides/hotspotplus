angular.module ( 'masterHotspotApp' ).filter ( 'requiredField', [ '$log', 'translateFilter', function ( $log, translateFilter ) {
  return function ( label, isRequired ) {
    return isRequired ? translateFilter ( 'requiredField' ) + " " + label : label;
  }
} ] );

app.filter ( 'englishNumber', function () {
  return function englishNumber ( value ) {
    value = String ( value );
    if ( !value ) return '';
    var s = value.toString ();
    s = s.replace ( /۱/g, "1" ).replace ( /۲/g, "2" ).replace ( /۳/g, "3" ).replace ( /۴/g, "4" ).replace ( /۵/g, "5" ).replace ( /۶/g, "6" ).replace ( /۷/g, "7" ).replace ( /۸/g, "8" ).replace ( /۹/g, "9" ).replace ( /۰/g, "0" ).replace ( /١/g, "1" ).replace ( /٢/g, "2" ).replace ( /٣/g, "3" ).replace ( /٤/g, "4" ).replace ( /٥/g, "5" ).replace ( /٦/g, "6" ).replace ( /٧/g, "7" ).replace ( /٨/g, "8" ).replace ( /٩/g, "9" ).replace ( /٠/g, "0" );
    return s;
  };
} );

app.filter ( 'persianNumber', function () {
  return function englishNumber ( value ) {
    value = String ( value );
    if ( !value ) return '';
    var s = value.toString ();
    s = s.replace ( /1/g, "۱" ).replace ( /2/g, "۲" ).replace ( /3/g, "۳" ).replace ( /4/g, "۴" ).replace ( /5/g, "۵" ).replace ( /6/g, "۶" ).replace ( /7/g, "۷" ).replace ( /8/g, "۸" ).replace ( /9/g, "۹" ).replace ( /0/g, "۰" ).replace ( /1/g, "۱" ).replace ( /2/g, "۲" ).replace ( /3/g, "۳" ).replace ( /4/g, "۴" ).replace ( /5/g, "۵" ).replace ( /6/g, "۶" ).replace ( /7/g, "۷" ).replace ( /8/g, "۸" ).replace ( /9/g, "۹" ).replace ( /0/g, "۰" );
    return s;
  };
} );


function hideLoading () {
  document.getElementById ( 'loader' ).style.display = 'none';
  var elems = document.getElementsByClassName ( 'appTemplate' );
  for ( var i in elems ) {
    if ( elems[ i ].style ) {
      elems[ i ].style.display = 'inherit';
    }
  }
}




