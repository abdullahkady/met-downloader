const fs = require('fs');
const path = require('path');
const fuzzy = require('fuzzy');
const chalk = require('chalk');
const inquirer = require('inquirer');
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

const { systemDownloadDirectory } = require('./config');

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

module.exports.getDownloadRootPath = async () => {
  const { downloadRootPath } = await inquirer.prompt([
    {
      name: 'downloadRootPath',
      message: `Enter a path to the ${chalk.bold(
        'parent'
      )} directory (this is not the final directory, a ${chalk.bold(
        'sub-directory'
      )} will be created for each course):`,
      validate: path => {
        const isValid = fs.existsSync(path) && fs.lstatSync(path).isDirectory();
        return isValid || `Directory doesn't exist, please try again.`;
      },
      default: systemDownloadDirectory
    }
  ]);
  return downloadRootPath;
};

const validateDirectory = path =>
  /^\w+[\w\-\s:()\][]*$/.test(path) ||
  'Directory name can only contain letters, numbers, dashes, underscores, colons, brackets, and whitespaces.';

module.exports.getCourseDirectory = async (defaultDirectory, rootPath) => {
  let { courseDirectory } = await inquirer.prompt([
    {
      name: 'courseDirectory',
      message: `Enter a directory name to be created for the course's material:`,
      validate: validateDirectory,
      default: defaultDirectory
    }
  ]);
  let downloadRootPath = path.resolve(rootPath, courseDirectory);
  while (fs.existsSync(downloadRootPath)) {
    ({ courseDirectory } = await inquirer.prompt([
      {
        name: 'courseDirectory',
        message: `"${chalk.italic(courseDirectory)}" already exists. Provide another name please`,
        validate: validateDirectory
      }
    ])); // Since re-assigning with destructuring, it has to be wrapped in parens.
    downloadRootPath = path.resolve(rootPath, courseDirectory);
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
        message: `Select the course to be downloaded. Start typing to search (hit ${chalk.bold.red(
          'CTRL + C'
        )} to exit the program)`,
        source: coursesFuzzySearch(coursesList.map(c => c.name))
      }
    ])
    .then(res => coursesList.find(c => c.name === res.course));

module.exports.getShouldOrderByFileType = () =>
  inquirer
    .prompt([
      {
        type: 'list',
        choices: [
          { name: 'By Week', value: false },
          { name: 'By File Type (Lectures, Assignments, etc.)', value: true }
        ],
        name: 'orderByFileType',
        message: 'How would you like to organize the files downloaded'
      }
    ])
    .then(res => res.orderByFileType);
