const path = require('path');
const fs = require('fs');

// Credits: https://stackoverflow.com/a/56951024/7502260
module.exports.isDoneDownloading = (filePath, timeout) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      watcher.close();
      reject(
        new Error('File did not exists and was not created during the timeout.')
      );
    }, timeout);

    fs.access(filePath, fs.constants.R_OK, err => {
      if (!err) {
        clearTimeout(timer);
        watcher.close();
        resolve();
      }
    });

    const dir = path.dirname(filePath);
    const basename = path.basename(filePath);
    const watcher = fs.watch(dir, (eventType, filename) => {
      if (eventType === 'rename' && filename === basename) {
        clearTimeout(timer);
        watcher.close();
        resolve();
      }
    });
  });

module.exports.isValidGucEmail = string => {
  return new RegExp(
    /^[a-zA-Z0-9_\-\.]+@student\.guc\.edu\.eg$/,
  ).test(string);
};

module.exports.isValidMetCourseUrl = string => {
  return new RegExp(
    /^http:\/\/met\.guc\.edu\.eg\/Courses\/Material\.aspx\?crsEdId=[1-9]*$/,
  ).test(string);
};
