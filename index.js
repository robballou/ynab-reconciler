require('dotenv').config();

const readline = require('readline');
const minimist = require('minimist');
const debug = require('debug');

const { YNAB } = require('./lib/ynab');

let token = null;
const d = debug('ynab-reconciler:main');

const question = async function question(text) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(text, (answer) => {
      resolve(answer);
      rl.close();
    });
  });
};

const getAccount = async function getAccount(ynab, budgetId) {
  if (typeof process.env.YNAB_ACCOUNT !== 'undefined') {
    return Promise.resolve(process.env.YNAB_ACCOUNT);
  }

  const accounts = await ynab.getAccounts(budgetId);

  if (accounts.length === 1) {
    return Promise.resolve(accounts[0].id);
  }

  return new Promise((resolve, reject) => {
    console.log('Choose an account:');
    accounts.forEach((account, ix) => {
      console.log(`#${(ix + 1)}: ${account.name}`);
    });

    question('Account:')
      .then((answer) => parseInt(answer, 10) - 1)
      .then((index) => {
        if (typeof accounts[index] !== 'undefined') {
          return resolve(accounts[index].id);
        }
        return reject(new Error('Invalid choice'));
      });
  });
};

const getBudget = async function getBudget(ynab) {
  if (typeof process.env.YNAB_BUDGET !== 'undefined') {
    return Promise.resolve(process.env.YNAB_BUDGET);
  }

  const budgets = await ynab.getBudgets();

  if (budgets.length === 1) {
    return Promise.resolve(budgets[0].id);
  }

  return new Promise((resolve, reject) => {
    console.log('Choose a budget:');
    budgets.forEach((budget, ix) => {
      console.log(`#${(ix + 1)}: ${budget.name}`);
    });

    question('Budget:')
      .then((answer) => parseInt(answer, 10) - 1)
      .then((index) => {
        if (typeof budgets[index] !== 'undefined') {
          return resolve(budgets[index].id);
        }
        return reject(new Error('Invalid choice'));
      });
  });
};

const assertToken = async function assertToken() {
  if (!token) {
    token = await question('YNAB token:');
  }

  if (!token) {
    console.error('Invalid YNAB token. Specify YNAB_TOKEN or enter it when prompted.');
    process.exit(1);
  }
};

const main = async function main(args) {
  if (typeof process.env.YNAB_TOKEN !== 'undefined') {
    token = process.env.YNAB_TOKEN;
  }

  assertToken();
  const ynab = new YNAB(token);

  const budgetId = await getBudget(ynab);
  const accountId = await getAccount(ynab);

  d(`Budget:\t${budgetId}`);
  d(`Account:\t${accountId}`);

  // get transactions
  // check if CSV file is specified
};

if (process.mainModule === module) {
  main(minimist(process.argv.slice(2)));
}
