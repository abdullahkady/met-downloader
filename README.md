A puppeteer (headless browser) script that downloads the material of any course hosted on the MET (GUC) website, and organizes the materials into their respective folders accordingly.

## Showcase

[![asciicast](https://asciinema.org/a/2ojibKGuBzk5IuUzgXMG2q33g.svg)](https://asciinema.org/a/2ojibKGuBzk5IuUzgXMG2q33g?speed=2)

## Usage

### npx (Recommended)
If you have `npx` installed, you can avoid installing the tool on your system. However chromium binaries will be downloaded every time you run the application, so you can use the below setup to avoid doing so.

```bash
export CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
npx met-downloader
```

When `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` is set to `true`, puppeteer skips downloading the binaries for chromium, however you **must** provide an executable path to a chromium binary (which is done via the `CHROMIUM_EXECUTABLE_PATH` environment variable). In the above example, it's assumed the default path to google-chrome, on an Ubuntu machine.

### Installing globally
If you don't have `npx` installed, or you would like to install the CLI tool so that you can use it anytime you can install it globally by running

```bash
npm i met-downloader -g
```
Note that this will fetch the chromium binaries, you can skip them as described above, but you will have to provide the executable chromium path as an environment every time you run the command (you can obviously configure this through your bash to avoid exporting the same environment repeatedly)
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
