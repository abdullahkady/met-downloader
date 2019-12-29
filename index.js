/** @typedef {import('puppeteer').Page} Page */
const puppeteer = require('puppeteer');
const { mkdirSync } = require('fs');
const { isDoneDownloading } = require('./utils');

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
  // TODO: Handle invalid credentials
};

const main = async () => {
  // TODO: Ask for input nicely :')

  let email, password, courseURL;
  try {
    [email, password] = process.argv[2].split(':'); // email:password
    courseURL = process.argv[3];
  } catch (error) {
    console.warn(error);
    return;
  }

  const browser = await puppeteer.launch({ headless: false, devtools: true });
  const page = await browser.newPage();
  await login(page, email, password);
  await page.goto(courseURL);

  await downloadMaterial(page);
  setTimeout(() => browser.close(), 1000);
};

main();
