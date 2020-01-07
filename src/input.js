const fs = require('fs');
const path = require('path');
const fuzzy = require('fuzzy');
const inquirer = require('inquirer');
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

const { DOWNLOAD_OUTPUT_PATH } = require('./config');

const isValidGucEmail = string => {
  return /^[a-zA-Z0-9_\-.]+@student\.guc\.edu\.eg$/.test(string);
};

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
  let downloadRootPath = path.resolve(DOWNLOAD_OUTPUT_PATH, downloadDirectoryName);
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
    downloadRootPath = path.resolve(DOWNLOAD_OUTPUT_PATH, downloadDirectoryName);
  }
  return downloadRootPath;
};

const coursesFuzzySearch = courses => async (answers, input) => {
  if (input === undefined) {
    return courses;
  }

  const results = fuzzy.filter(input, courses);
  return results.map(c => c.original);
};

module.exports.getCourse = coursesList =>
  inquirer
    .prompt([
      {
        type: 'autocomplete',
        pageSize: 5,
        name: 'course',
        message: 'Select the course to be downloaded. Start typing to search: ',
        source: coursesFuzzySearch(coursesList.map(c => c.name))
      }
    ])
    .then(res => coursesList.find(c => c.name === res.course));
