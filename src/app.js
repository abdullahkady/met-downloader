/** @typedef {import('puppeteer').Page} Page */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const ora = require('ora');

const { URLS } = require('./constants');
const input = require('./input');
const { isHeadless } = require('./config');
const { isDoneDownloading, constructMaterialLink, uniqueBy } = require('./utils');

/**
 * @param {puppeteer.Page} page
 * Expects that the page paramter is already navigated to the right
 * URL (course materials page)
 * */
const downloadMaterial = async (page, downloadDirectoryPath, spinner, orderByFileType) => {
  if (orderByFileType) {
    await Promise.all([
      page.click('#ctl00_AcademicsMasterContent_fileTypeLinkBtn'),
      page.waitForNavigation({ waitUntil: 'load' })
    ]);
  }

  const materialsSections = await page.$$eval(
    '.badgeContainer',
    containers =>
      containers
        .map(container => {
          // The element containing the course name differs based on the view (by type vs by week)
          // and since the boolean "orderByFileType" won't be available in the page context, this
          // hack is the easiest way to get a compatible solution for both cases.
          let directory = container.querySelector('.badgeDetails > h3');
          if (directory) {
            directory = directory.innerText;
          } else {
            directory = container.querySelector('.badgeHeader h3').innerText;
          }

          const files = [...container.querySelectorAll('a')]
            .filter(a => a.href && a.innerText) // They contain extra empty anchor tags \_0_/
            .map(node => ({
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
        .filter(({ files }) => files.length > 0) // Ignore empty weeks (exams week for instance)
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

module.exports.runApplication = async () => {
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
  spinner.stop();
  const rootDownloadPath = await input.getDownloadRootPath();

  spinner.start('Fetching available courses');
  const coursesList = await fetchAllCourses(page);
  while (true) {
    spinner.stop();
    const selectedCourse = await input.getCourse(coursesList);
    spinner.start('Opening the course page');
    await page.goto(constructMaterialLink(selectedCourse.url));

    spinner.stop();
    const courseDirectoryPath = await input.getCourseDirectory(
      selectedCourse.name,
      rootDownloadPath
    );
    fs.mkdirSync(courseDirectoryPath);

    const orderByFileType = await input.getShouldOrderByFileType();
    spinner.start();
    await downloadMaterial(page, courseDirectoryPath, spinner, orderByFileType);
    spinner.stop();
    console.log(`\n"${selectedCourse.name}" finished downloading.\n`);
  }
};
