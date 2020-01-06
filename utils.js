const path = require('path');
const fs = require('fs');

// Credits: https://stackoverflow.com/a/56951024/7502260
module.exports.isDoneDownloading = (filePath, timeout) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      watcher.close();
      reject(new Error('File did not exists and was not created during the timeout.'));
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
  return /^[a-zA-Z0-9_\-\.]+@student\.guc\.edu\.eg$/.test(string);
};

module.exports.isValidMetCourseUrl = string => {
  const matchingQueryParam = string.match(/crsEdId=\d+/);
  return (
    /^http:\/\/met\.guc\.edu\.eg\/Courses/.test(string) &&
    matchingQueryParam &&
    matchingQueryParam.length === 1
  );
};

module.exports.constructMaterialLink = inputURL => {
  // Note that the input URL can be any valid course URL (not necessarily the materials tab).
  const courseIDQueryParam = inputURL.match(/crsEdId=\d+/).pop(); // crsEdId=912
  return `http://met.guc.edu.eg/Courses/Material.aspx?${courseIDQueryParam}`;
};
