#!/usr/bin/env node
const boxen = require('boxen');
const chalk = require('chalk');

const { runApplication } = require('./app');

class SignalRef {
  // This is a bug with inquirer, refer to:
  // https://github.com/SBoudrias/Inquirer.js/issues/293#issuecomment-422890996
  constructor(signal, handler) {
    this.signal = signal;
    this.handler = handler;

    process.on(this.signal, this.handler);
    this.interval = setInterval(() => {}, 10000);
  }

  unref() {
    clearInterval(this.interval);
    process.removeListener(this.signal, this.handler);
  }
}

const exitApplication = () => {
  let signOff = '\n';
  signOff += chalk.blue('Thank you for using ') + chalk.blue.bold('met-downloader') + '.\n';
  signOff += `${chalk.blue('If you enjoy it, feel free to leave a')} ${chalk.red.bold('star')}\n`;
  signOff += chalk.yellow.bold.italic('https://github.com/AbdullahKady/met-downloader\n\n');
  signOff += chalk.gray.italic('Feedback and contribution is welcome as well :)');
  console.log(
    boxen(signOff, {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'green',
      align: 'center'
    })
  );
  process.exit(0);
};

if (process.platform === 'win32') {
  // To be able to capture SIGINT in windows systems :)
  const rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('SIGINT', () => {
    process.emit('SIGINT');
  });
}

const main = async () => {
  const signalRef = new SignalRef('SIGINT', exitApplication);

  try {
    await runApplication();
  } finally {
    signalRef.unref();
  }
};

main();
