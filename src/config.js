const path = require('path');
module.exports.DOWNLOAD_OUTPUT_PATH =
  process.env.DOWNLOAD_OUTPUT_PATH || path.join(__dirname, '..', 'downloads');

module.exports.isHeadless = process.env.IS_HEADLESS || true;
