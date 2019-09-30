const Sntp = require('@hapi/sntp');

// All options are optional

const options = {
    host: 'pool.ntp.org',  // Defaults to pool.ntp.org
    port: 123,                      // Defaults to 123 (NTP)
    resolveReference: true,         // Default to false (not resolving)
    timeout: 1000                   // Defaults to zero (no timeout)
};

// Request server time

const exec = async function () {

    try {
        const time = await Sntp.now();
        console.dir(time)
        console.log(new Date(time))
        console.log(new Date())
        process.exit(0);
    }
    catch (err) {
        console.log('Failed: ' + err.message);
        process.exit(1);
    }
};

exec();
