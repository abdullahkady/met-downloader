const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');

const { DOWNLOAD_OUTPUT_PATH } = require('./config');
const { isValidGucEmail, isValidMetCourseUrl } = require('./utils');

module.exports.getCredentials = () =>
  inquirer.prompt([
    {
      type: 'input',
      name: 'email',
      message: 'Enter email:',
      validate: email => {
        if (isValidGucEmail(email)) {
          return true;
        }

        return (
          'Please use your GUC email that is registered on' +
          ' the MET website (eg. your.name@student.guc.edu.eg)'
        );
      }
    },
    {
      type: 'password',
      mask: '*',
      name: 'password',
      message: 'Enter password:'
    }
  ]);

module.exports.getCourseURL = () =>
  inquirer.prompt([
    {
      type: 'input',
      name: 'courseURL',
      message: 'Enter course URL:',
      validate: courseURL => {
        if (isValidMetCourseUrl(courseURL)) {
          return true;
        }

        return (
          'Please enter a valid course URL' +
          ' (eg. http://met.guc.edu.eg/Courses/Material.aspx?crsEdId=954)'
        );
      }
    }
  ]);

module.exports.getDownloadDirectory = async defaultDirectory => {
  let { downloadDirectoryName } = await inquirer.prompt([
    {
      name: 'downloadDirectoryName',
      message: `Enter a directory name to be created for the course's material:`,
      validate: input =>
        /^\w+[\w\-\s:]*$/.test(input) ||
        'Directory name can only contain letters, numbers, dashes, underscores, colons, and whitespaces.',
      default: defaultDirectory
    }
  ]);
  let downloadRootPath = path.resolve(DOWNLOAD_OUTPUT_PATH, 'downloads', downloadDirectoryName);
  while (fs.existsSync(downloadRootPath)) {
    ({ downloadDirectoryName } = await inquirer.prompt([
      {
        name: 'downloadDirectoryName',
        message: `"${downloadDirectoryName}" already exists. Provide another name please`,
        validate: input =>
          /^\w+[\w\-\s:]*$/.test(input) ||
          'Directory name can only contain letters, numbers, dashes, underscores, colons, and whitespaces.'
      }
    ])); // Since re-assigning with destructuring, it has to be wrapped in parens.
    downloadRootPath = path.resolve(DOWNLOAD_OUTPUT_PATH, 'downloads', downloadDirectoryName);
  }
  return downloadRootPath;
};

module.exports.getBrowserOptions = () =>
  inquirer.prompt([
    {
      name: 'isHeadless',
      type: 'confirm',
      message: `Launch a headless browser (type 'n' if you want to see the browser automation in action).`,
      default: true
    }
  ]);
