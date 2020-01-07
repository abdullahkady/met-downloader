let isHeadless = true;
if (process.env.IS_HEADLESS !== undefined && process.env.IS_HEADLESS === 'false') {
  isHeadless = false;
}
module.exports.systemDownloadDirectory = require('downloads-folder')();
module.exports.isHeadless = isHeadless;
module.exports.chromiumPath = process.env.CHROMIUM_EXEC_PATH;
