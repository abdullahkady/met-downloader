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
