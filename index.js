require('dotenv').config();

const readline = require('readline');
const minimist = require('minimist');
const debug = require('debug');
const csv = require('csv-parse');
const os = require('os');
const fs = require('fs');

const { YNAB } = require('./lib/ynab');

let token = null;
const d = debug('ynab-reconciler:main');

/**
 * Pose a question.
 */
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

/**
 * Get or choose an account.
 */
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

/**
 * Get or choose a budget.
 */
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

const getTransactions = async function getTransactions(ynab, budgetId, accountId) {
  return new Promise((resolve, reject) => {
    fs.readFile('transactions', async (err, data) => {
      if (err) {
        const transactions = await ynab.getTransactions(budgetId, accountId);
        fs.writeFile('transactions', JSON.stringify(transactions), () => {
          resolve(transactions);
        });
      }
      else {
        resolve(JSON.parse(data));
      }
    });
  });
};

const assertCsv = async function assertCsv(args) {
  if (typeof args.csv === 'undefined') {
    console.error('Invalid CSV file. Specify a CSV file with --csv');
    process.exit(1);
  }
};

const assertToken = async function assertToken(args) {
  if (!token) {
    token = await question('YNAB token:');
  }

  if (!token) {
    console.error('Invalid YNAB token. Specify YNAB_TOKEN or enter it when prompted.');
    process.exit(1);
  }
};

const getHome = function getHome() {
  const osHome = os.homedir();
  const home = process.env.HOME || osHome;
  return `${home}/`;
};

const main = async function main(args) {
  if (typeof process.env.YNAB_TOKEN !== 'undefined') {
    token = process.env.YNAB_TOKEN;
  }
  else if (typeof args.token !== 'undefined') {
    token = args.token;
  }

  assertToken();
  assertCsv(args);
  const ynab = new YNAB(token);

  const budgetId = args.budget || await getBudget(ynab);
  const accountId = args.account || await getAccount(ynab);

  d(`Budget:\t${budgetId}`);
  d(`Account:\t${accountId}`);

  // get transactions
  const transactions = await getTransactions(ynab, budgetId, accountId);
  const hashtable = {};

  transactions.data.transactions.forEach((transaction) => {
    const entry = transaction.payee_name.substr(0, 1);
    if (typeof hashtable[entry] === 'undefined') {
      hashtable[entry] = [];
    }

    hashtable[entry].push(transaction);
  });

  const path = args.csv.replace('~/', getHome());

  const readStream = fs.createReadStream(path);
  const parser = csv();
  parser.on('readable', () => {
    const entry = [];
    let item;
    while (item = parser.read()) {
      entry.push(item);
    }
    console.log(entry);
  });
  parser.on('error', (err) => {
    console.error(err);
  });
  readStream.pipe(parser);
  readStream.on('end', () => {
    parser.end();
  });

  // check if CSV file is specified
};

if (process.mainModule === module) {
  main(minimist(process.argv.slice(2)));
}
