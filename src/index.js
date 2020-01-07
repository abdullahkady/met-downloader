/** @typedef {import('puppeteer').Page} Page */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const ora = require('ora');
const boxen = require('boxen');
const chalk = require('chalk');

const { URLS } = require('./constants');
const input = require('./input');
const { isHeadless } = require('./config');
const { isDoneDownloading, constructMaterialLink, uniqueBy } = require('./utils');

/**
 * @param {puppeteer.Page} page
 * Expects that the page paramter is already navigated to the right
 * URL (course materials page)
 * */
const downloadMaterial = async (page, downloadDirectoryPath, spinner) => {
  const materialsSections = await page.$$eval('.badgeContainer', containers =>
    containers
      .map(container => {
        const directory = container.querySelector('.badgeDetails > h3').innerText;
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
  await page.goto(URLS.HOMEPAGE);
  await page.focus('.userNameTBox');
  await page.keyboard.type(email);
  await page.focus('.passwordTBox');
  await page.keyboard.type(password);

  await Promise.all([page.click('.loginBtn'), page.waitForNavigation({ waitUntil: 'load' })]);

  // Easiest way to check for non-logged in is to search for a div with id=logged
  // which is only available after the user is successfully logged in.
  return (await page.$('#logged')) !== null;
};

/**
 * @param {puppeteer.Page} page
 * Fetches all courses available on the website (post&under graduate), and sorts
 * them so that if the user has 'my courses' populated, they would be shown first.
 * */
const fetchAllCourses = async page => {
  await page.goto(URLS.UNDERGRADUATE_COURSES);
  const undergraduateCourses = await page.$$eval('.coursesLst', elements =>
    elements.map(e => ({ name: e.innerText, url: e.href }))
  );

  await page.goto(URLS.POSTGRADUATE_COURSES);
  const postgraduateCourses = await page.$$eval('#list a', elements =>
    elements.map(e => ({ name: e.innerText, url: e.href }))
  );

  await page.goto(URLS.HOMEPAGE);
  const suggestedCourses = await page.$$eval('#courses_menu a', elements =>
    elements.slice(1, -1).map(a => `${a.innerText} ${a.title}`)
  );

  // Courses are often duplicated (say CSEN 102 under both MET, and DMET)
  // therefore duplicates are eliminated
  const availableCourses = uniqueBy([...undergraduateCourses, ...postgraduateCourses], 'name');

  // Sort the courses according to the user's set of chosen courses
  // available under 'my courses' on the website
  return availableCourses.sort((a, b) => {
    let indexA = suggestedCourses.indexOf(a.name);
    let indexB = suggestedCourses.indexOf(b.name);
    indexA = indexA === -1 ? 99 : indexA;
    indexB = indexB === -1 ? 99 : indexB;

    return indexA < indexB ? -1 : 1;
  });
};

const runApplication = async () => {
  const { email, password } = await input.getCredentials();

  const browser = await puppeteer.launch({ headless: isHeadless });
  const context = await browser.createIncognitoBrowserContext();
  const page = await context.newPage();

  const spinner = ora('Verifying credentials').start();
  if (!(await login(page, email, password))) {
    spinner.stop();
    console.log('You have entered invalid credentials, please try again.');
    await browser.close();
    return;
  }

  spinner.text = 'Fetching available courses';
  const coursesList = await fetchAllCourses(page);
  spinner.stop();
  const selectedCourse = await input.getCourse(coursesList);
  spinner.start('Opening the course page');
  const response = await page.goto(constructMaterialLink(selectedCourse.url));

  if (response.request().redirectChain().length !== 0) {
    // If the request got redirected, then the course ID was invalid, and the
    // request was thus redirected back to the main page.
    spinner.stop();
    console.log('You have entered an invalid course. Please make sure the course exists.');
    await browser.close();
    return;
  }

  const defaultDirectory = selectedCourse.name;
  spinner.stop();
  const downloadRootPath = await input.getDownloadDirectory(defaultDirectory);
  fs.mkdirSync(downloadRootPath);

  spinner.start('downloading');
  await downloadMaterial(page, downloadRootPath, spinner);
  spinner.stop();
  console.log('Download finished successfully!');
  await browser.close();
};

const main = async () => {
  await runApplication();

  let exitMessage = '\n';
  exitMessage += chalk.blue('Thank you for using ') + chalk.blue.bold('met-downloader');
  exitMessage += chalk.blue('. For feedback please head to: \n');
  exitMessage += chalk.yellow.bold.italic('https://github.com/AbdullahKady/met-downloader\n');
  console.log(
    boxen(exitMessage, {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'green',
      align: 'center'
    })
  );
};

main();
