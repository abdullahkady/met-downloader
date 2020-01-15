A puppeteer (headless browser) script that downloads the material of any course hosted on the MET (GUC) website, and organizes the materials into their respective folders accordingly.

## Showcase

[![asciicast](https://asciinema.org/a/2ojibKGuBzk5IuUzgXMG2q33g.svg)](https://asciinema.org/a/2ojibKGuBzk5IuUzgXMG2q33g?speed=2)

## Usage

### npx (Recommended)

Use `npx`, this avoids installing the tool on your system. However chromium binaries will be downloaded every time you run the application, so you can use the below setup to avoid doing so.

```bash
export CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
npx met-downloader
```

When `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` is set to `true`, puppeteer skips downloading the binaries for chromium, however it must be provided with an executable path to a chromium binary (which is done via the `CHROMIUM_EXECUTABLE_PATH` environment variable). In the above example, it's assumed the default path to google-chrome, on an Ubuntu machine.

### Installing globally

If you would like, you can install the extension globally by running

```bash
npm i met-downloader -g
```

Once the installation is done, simply run

```bash
met-downloader
```

### From the source code

Clone the repo

```bash
git clone git@github.com:AbdullahKady/met-downloader.git
```

After cloning, install the dependencies by running

```bash
npm i
```

Finally run the application normally, and follow the interactive input

```bash
npm start
```
