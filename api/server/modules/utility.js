const Q = require('q');

const jsSHA = require('jssha');
const keygen = require('keygenerator');
const crypto = require('crypto');
const algorithm = 'aes192';
const temp = require('temp').track();
const EasyZip = require('easy-zip').EasyZip;
const logger = require('./logger');
const config = require('./config');
const fs = require('fs');
const log = logger.createLogger();

Date.myNewDate = function() {
  const myNow = new Date();
  myNow.setTime(myNow.getTime() + myNow.getTimezoneOffset() * 60 * 1000);
  return myNow;
};

exports.md5 = function(data) {
  return crypto
    .createHash('md5')
    .update(data)
    .digest('hex');
};

const encrypt = (exports.encrypt = function(text, password) {
  if (text == null || password == null) {
    log.error('Password or text is empty, text: ', text, ' pass: ', password);
    return null;
  }
  if (typeof text === 'number') {
    text = text.toString();
  }
  log.debug('encrypt str:', text, 'pass:', password);
  const cipher = crypto.createCipher(algorithm, password);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
});

exports.trimMac = function(mac) {
  if (typeof mac !== 'string') {
    return null;
  }
  return mac
    .replace(/-/g, '')
    .replace(/:/g, '')
    .replace(/\./g, '');
};

exports.verifyMac = function(mac) {
  const tester = /^[0-9a-f]{1,2}([\.:-])(?:[0-9a-f]{1,2}\1){4}[0-9a-f]{1,2}$/i;
  return tester.test(mac);
};

const decrypt = (exports.decrypt = function(text, password) {
  const decipher = crypto.createDecipher(algorithm, password);
  let decrypted = decipher.update(text, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
});

exports.isValidPassword = function(password, hashPassword, hashSalt) {
  return Q.Promise(function(resolve, reject) {
    if (password === decrypt(hashPassword, hashSalt)) {
      resolve();
    } else {
      reject('invalid credential');
    }
  });
};

exports.authenticate = function(username1, password1, username2, password2) {
  const deferred = Q.defer();
  if (
    password1 &&
    username1 &&
    password2 == this.pass2sha(password1, username1)
  ) {
    deferred.resolve({ok: true});
  } else {
    deferred.reject({ok: false});
  }
  return deferred.promise;
};

exports.pass2sha = function(password, salt) {
  salt = salt || this.options.salt;
  if (!password) {
    log.error('password is empty');
    throw new Error('password is empty');
  }
  const shaObj = new jsSHA(password, 'TEXT');
  return shaObj.getHMAC(
    salt.toString(),
    this.options.inputType,
    this.options.encription,
    this.options.outputType
  );
};

exports.createVerificationCode = function() {
  return Math.floor(Math.random() * 9000) + 1000;
};

exports.createRandomHotspotPassword = function() {
  return (Math.floor(Math.random() * 9000) + 1000).toString();
};

exports.createRandomNumericalPassword = function() {
  return (Math.floor(Math.random() * 900000) + 1000).toString();
};

exports.createRandomLongNumericalPassword = function() {
  return (Math.floor(Math.random() * 90000000) + 1000).toString();
};

exports.createPassword = function(length) {
  length = length || 5;
  return keygen._({
    length: length,
    forceLowercase: true,
    exclude: ['O', '0', 'I', '1', 'j', 'q', 'g', 'i', 'e', 'a', 'y', 'v'],
  });
};
exports.createRandomKeyword = function(length) {
  length = length || 5;
  return keygen._({
    length: length,
  });
};

exports.toByte = function(amount, unit) {
  try {
    if (unit == null || unit == undefined) {
      return null;
    }
    if (amount == null || amount == undefined) {
      return null;
    }
    unit = unit.toLowerCase();
    amount = Number(amount);
    if (unit.toLowerCase() == 'kb') {
      return amount * 1024;
    }
    if (unit.toLowerCase() == 'mb') {
      return amount * 1024 * 1024;
    }
    if (unit.toLowerCase() == 'gb') {
      return amount * 1024 * 1024 * 1024;
    }
  } catch (error) {
    log.error(error);
  }
};

exports.toKByte = function(amount) {
  try {
    if (amount == null || amount == undefined) {
      return null;
    }
    amount = Number(amount);
    return amount / 1024;
  } catch (error) {
    log.error(error);
  }
};
exports.toMByte = function(amount) {
  try {
    if (amount == null || amount == undefined) {
      return null;
    }
    amount = Number(amount);
    return amount / 1024 / 1024;
  } catch (error) {
    log.error(error);
  }
};
exports.toGByte = function(amount) {
  try {
    if (amount == null || amount == undefined) {
      return null;
    }
    amount = Number(amount);
    return amount / 1024 / 1024 / 1024;
  } catch (error) {
    log.error(error);
  }
};
exports.convertGBtoMB = function(amount) {
  try {
    if (amount == null || amount == undefined) {
      return null;
    }
    amount = Number(amount);
    return amount * 1024;
  } catch (error) {
    log.error(error);
  }
};
exports.convertGBtoKB = function(amount) {
  try {
    if (amount == null || amount == undefined) {
      return null;
    }
    amount = Number(amount);
    return amount * 1024 * 1024;
  } catch (error) {
    log.error(error);
  }
};
exports.convertGBtoByte = function(amount) {
  try {
    if (amount == null || amount == undefined) {
      return null;
    }
    amount = Number(amount);
    return amount * 1024 * 1024 * 1024;
  } catch (error) {
    log.error(error);
  }
};
/* check value parameter for valid string input (not null or empty or undefined)
 value: string
 result: boolean
 */
exports.isValidString = function(value) {
  return typeof value === 'string' && value.length > 0 && value !== 'undefined';
};
exports.toKbps = function(amount, unit) {
  if (unit == null || unit == undefined) {
    return null;
  }
  if (amount == null || amount == undefined) {
    return null;
  }
  amount = Number(amount);
  if (unit.toLowerCase() == 'kbps') {
    return amount;
  }
  if (unit.toLowerCase() == 'mbps') {
    return amount * 1000;
  }
  if (unit.toLowerCase() == 'gbps') {
    return amount * 1000 * 1000;
  }
};
/* Convert amount to Mbps base on unit
 amount: number
 unit: string
 */
exports.toMbps = function(amount, unit) {
  if (unit == null || unit == undefined) {
    return null;
  }
  if (amount == null || amount == undefined) {
    return null;
  }
  amount = Number(amount);
  if (unit.toLowerCase() == 'bps') {
    return Math.round(amount / (1024 * 1024));
  }
  if (unit.toLowerCase() == 'kbps') {
    return Math.round(amount / 1024);
  }
  if (unit.toLowerCase() == 'mbps') {
    return Math.round(amount);
  }
  if (unit.toLowerCase() == 'gbps') {
    return Math.round(amount * 1024);
  }
};

/*
 [
 {
 'type':'file',
 'path':'filePath' ,
 },
 {
 'type':'folder',
 'name':'folderName',
 'files':[{path:'opt/ssd',name:'ssd'}]
 }

 ]
 */
exports.zipIt = function(zipName, resources) {
  const files = [];
  return Q.Promise(function(resolve, reject) {
    try {
      const zip = new EasyZip();
      for (const i in resources) {
        const resource = resources[i];
        if (resource.type == 'file') {
          files.push({source: resource.path, target: resource.name});
        } else if (resource.type == 'folder') {
          files.push({target: resource.name});
          for (const j in resource.files) {
            files.push({
              source: resource.files[j].path,
              target: resource.name + '/' + resource.files[j].name,
            });
          }
        }
      }
      temp.mkdir('zipItFiles', function(error, path) {
        if (error) {
          log.error(error);
          return reject(error);
        }
        zip.batchAdd(files, function() {
          const zipFilePath = path + '/' + zipName;
          console.log('zipFilePath');
          console.log(zipFilePath);
          zip.writeToFile(zipFilePath, function(error, path) {
            if (error) {
              log.error(error);
              return reject(error);
            }
            return resolve(zipFilePath);
          });
        });
      });
    } catch (error) {
      return reject(error);
    }
  });
};

exports.removeAllSpace = function(str) {
  if (str.toString) {
    str = str.toString();
  }
  return str.replace(/\s/g, '');
};

exports.verifyAndTrimMobile = function(mobile) {
  if (typeof mobile !== 'string' && typeof mobile !== 'number') {
    return null;
  }
  mobile = mobile.toString();
  mobile = mobile.substring(mobile.length - 10);
  if (mobile.length < 10) {
    return null;
  }
  /*
		if ( mobile.indexOf ( 0 ) == '0' || mobile.indexOf ( 0 ) == 0 ) {
			return null;
		}
	*/
  return mobile;
};

exports.isPersianSms = function(text) {
  const persianRegex = /[\u0600-\u06FF\uFB8A\u067E\u0686\u06AF]+/;
  return persianRegex.test(text);
};

exports.isValidIp = function(ip) {
  if (typeof ip !== 'string') {
    throw new TypeError('Expected a string');
  }
  const matcher = /^(?:(?:2[0-4]\d|25[0-5]|1\d{2}|[1-9]?\d)\.){3}(?:2[0-4]\d|25[0-5]|1\d{2}|[1-9]?\d)$/;
  return matcher.test(ip);
};

exports.clean = function(sourceArray, deleteValue) {
  for (let i = 0; i < sourceArray.length; i++) {
    if (sourceArray[i] == deleteValue) {
      sourceArray.splice(i, 1);
      i--;
    }
  }
  return sourceArray;
};

exports.printJobQueueStates = function(logger, thqQueue, queueName) {
  thqQueue.getJobCounts().then(function(result) {
    logger.warn(queueName, ' JOBS :', result);
  });
};
exports.cleanupJobQueue = function(thqQueue, seconds) {
  seconds = 2 * 86400 * 1000;
  // cleans all jobs that completed over 5 seconds ago.
  try {
    thqQueue.clean(seconds, 'wait');
    thqQueue.clean(seconds, 'completed');
    thqQueue.clean(seconds, 'active');
    thqQueue.clean(seconds, 'delayed');
    thqQueue.clean(seconds, 'failed');
  } catch (e) {
    log.error(e);
  }
};

exports.writeStringToFile = function(stringContent) {
  return Q.Promise(function(resolve, reject) {
    const stream = temp.createWriteStream();
    stream.write(stringContent);
    stream.on('finish', function() {
      return resolve(stream.path);
    });
    stream.on('error', function(error) {
      return reject(error);
    });
    stream.end();
  });
};

exports.writeStringToFileInPath = function(path, stringContent) {
  return Q.Promise(function(resolve, reject) {
    const stream = fs.createWriteStream(path);
    stream.write(stringContent);
    stream.on('finish', function() {
      return resolve(stream.path);
    });
    stream.on('error', function(error) {
      return reject(error);
    });
    stream.end();
  });
};
/*

exports.getApiAddress = function() {
  return process.env.INTERNAL_API_ADDRESS;
};
*/

exports.getSystemUuid = function(path) {
  path = path || '/etc/machine-id';
  return Q.Promise(function(resolve, reject) {
    fs.readFile(path, 'utf8', function(error, systemId) {
      if (error) {
        log.error(error);
        return reject(error);
      }
      if (!systemId) {
        return reject('systemid not found');
      }
      return resolve(systemId.trim());
    });
  });
};

exports.checkDirectory = function(directory, callback) {
  fs.stat(directory, function(error, stats) {
    if (error) {
      callback(error);
    } else {
      callback(null, stats);
    }
  });
};
