var licenseFile = require ( 'nodejs-license-file' );
var config = require ( './config' );
var licenseTemplate = config.LICENSE_TEMPLATE;

try {

  var licenseFileContent = licenseFile.generate ( {
    privateKeyPath: '/Users/payamyousefi/projects/hotspotplusLicenseServer/keys/pem/private_key.pem',
    template:       licenseTemplate,
    data:           {
      licenseVersion:     '1',
      applicationVersion: '1.0.0',
      businessId:         "_",
      systemUuid:         "6a79c2c248de4dfc9535ec982bb90c07",
      creationDate:       "2018-6-16 12:58:07",
      expiresAt:          "2030-6-16 12:58:07",
      mobile:             '09120243628',
      title:              "هات اسپات پلاس",
      fullName:           "پیام یوسفی",
      sms:                true,
      payment:            false,
      member:             true,
      log:                false,
      onlineUsers:        10000,
      email:              "info@127.0.0.1:4000",
      username:           "demo@gmail.com",
      password:           "123",
    }
  } );
  /*
*                                       '{{&licenseVersion}}',
            '{{&systemConfig}}',
            '{{&modules}}',
            '{{&services}}',
            '{{&scripts}}',
            '{{&serial}}',
*/

  console.log ( licenseFileContent );

} catch ( err ) {
  console.log ( err );
}
