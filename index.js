/** @typedef {import('puppeteer').Page} Page */
const puppeteer = require('puppeteer');
const inquirer = require('inquirer');
const { mkdirSync } = require('fs');
const {
  isDoneDownloading,
  isValidGucEmail,
  isValidMetCourseUrl,
  constructMaterialLink
} = require('./utils');

/**
 * @param {puppeteer.Page} page
 * */
const downloadMaterial = async page => {
  const materialsSections = await page.$$eval('.badgeContainer', containers =>
    containers
      .map(container => {
        const directory = container
          .querySelector('.badgeDetails > h3')
          .innerText.replace(/\s/g, '_');
        const files = Array.from(container.querySelectorAll('a')).map(node => ({
          fileName: node
            .getAttribute('href')
            .split('file=')
            .pop(),
          id: node.id
        }));

        return {
          directory,
          files
        };
      })
      .filter(({ files }) => files.length > 0)
  );

  for (const [i, { directory, files }] of materialsSections.entries()) {
    const path = `${__dirname}/downloads/${i + 1}-${directory}`;
    await mkdirSync(path);
    await page._client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: path
    });

    for (const { id, fileName } of files) {
      await page.click(`#${id}`);
      await isDoneDownloading(`${path}/${fileName}`, 60000);
    }
  }
};

/**
 * @param {puppeteer.Page} page
 * @param {string} email
 * @param {string} password
 * */
const login = async (page, email, password) => {
  const URL = 'http://met.guc.edu.eg/';
  await page.goto(URL);
  await page.focus('.userNameTBox');
  await page.keyboard.type(email);
  await page.focus('.passwordTBox');
  await page.keyboard.type(password);

  await Promise.all([
    page.click('.loginBtn'),
    page.waitForNavigation({ waitUntil: 'load' })
  ]);

  // Easiest way to check for non-logged in is to search for a div with id=logged
  // which is only available after the user is successfully logged in.
  return (await page.$('#logged')) !== null;
};

const captureInput = () => {
  return inquirer.prompt([
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
      name: 'password',
      message: 'Enter password:'
    },
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
};

const main = async () => {
  const { email, password, courseURL } = await captureInput();
  const browser = await puppeteer.launch({ headless: false, devtools: true });
  const page = await browser.newPage();

  if (!(await login(page, email, password))) {
    console.log('You have entered invalid credentials, please try again.');
    await browser.close();
    return;
  }

  const response = await page.goto(constructMaterialLink(courseURL));
  if (response.request().redirectChain().length !== 0) {
    // If the request got redirected, then the course ID was invalid, and the
    // request was thus redirected back to the main page.
    console.log(
      'You have entered an invalid course. Please make sure the course exists.'
    );
    await browser.close();
    return;
  }

  await downloadMaterial(page);
  await browser.close();
};

main();
