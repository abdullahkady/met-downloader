/** @typedef {import('puppeteer').Page} Page */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const ora = require('ora');

const input = require('./input');
const { isDoneDownloading, constructMaterialLink } = require('./utils');

/**
 * @param {puppeteer.Page} page
 * */
const downloadMaterial = async (page, downloadDirectoryPath, spinner) => {
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
    const sectionDirectory = path.resolve(downloadDirectoryPath, `${i + 1}-${directory}`);
    fs.mkdirSync(sectionDirectory);
    await page._client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: sectionDirectory
    });

    for (const [j, { id, fileName }] of files.entries()) {
      spinner.text = `downloading ${i + 1}/${materialsSections.length} (${j + 1}/${files.length})`;
      await page.click(`#${id}`);
      await isDoneDownloading(path.resolve(sectionDirectory, fileName), 100000);
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

  await Promise.all([page.click('.loginBtn'), page.waitForNavigation({ waitUntil: 'load' })]);

  // Easiest way to check for non-logged in is to search for a div with id=logged
  // which is only available after the user is successfully logged in.
  return (await page.$('#logged')) !== null;
};

const runApplication = async () => {
  const { email, password } = await input.getCredentials();
  const { isHeadless } = await input.getBrowserOptions();

  const browser = await puppeteer.launch({ headless: isHeadless });
  const page = await browser.newPage();

  const spinner = ora('Verifying credentials').start();
  if (!(await login(page, email, password))) {
    spinner.stop();
    console.log('You have entered invalid credentials, please try again.');
    await browser.close();
    return;
  }

  spinner.stop();
  const { courseURL } = await input.getCourseURL();
  const response = await page.goto(constructMaterialLink(courseURL));

  if (response.request().redirectChain().length !== 0) {
    // If the request got redirected, then the course ID was invalid, and the
    // request was thus redirected back to the main page.
    spinner.stop();
    console.log('You have entered an invalid course. Please make sure the course exists.');
    await browser.close();
    return;
  }

  const defaultDirectory = await page.$$eval('.coursesPageTitle', elements =>
    elements
      .map(e => e.innerText)
      .join('::')
      .replace(/\s/g, '_')
  );
  const downloadRootPath = await input.getDownloadDirectory(defaultDirectory);
  fs.mkdirSync(downloadRootPath);

  spinner.start();
  await downloadMaterial(page, downloadRootPath, spinner);
  spinner.stop();
  console.log('Download finished successfully!');
  await browser.close();
};

const main = async () => {
  await runApplication();
  console.log('\nThank you for using met-material-downloader. For feedback please head to: ');
  console.log('https://github.com/AbdullahKady/met-material-downloader');
};

main();
