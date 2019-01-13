var licenseFile = require ( 'nodejs-license-file' );
var config=  require("./config");
try {

  var template =  config.LICENSE_TEMPLATE;

  var data = licenseFile.parse({
    publicKeyPath: '/Users/payamyousefi/projects/hotspotplusLicenseServer/keys/pem/public_key.pem',
    licenseFilePath: '../keys/sample.lc',
    template:       template
  });

  console.log(data);

} catch (err) {

  console.log(err);
}
