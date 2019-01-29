const debug = require('debug');
const fetch = require('node-fetch');

const defaultOptions = {
  base: 'https://api.youneedabudget.com/v1'
};

class YNAB {
  constructor(token, options = {}) {
    this.options = {
      ...defaultOptions,
      ...options
    };

    this.token = token;
    this.debug = debug('ynab-reconciler:ynab');
    this.cache = {};
  }

  async getAccounts(budgetId) {
    return this.request(`/budgets/${budgetId}/accounts`);
  }

  async getBudgets() {
    return this.request('/budgets');
  }

  async request(endpoint) {
    const { base } = this.options;
    const fullUrl = `${base}${endpoint}`;
    this.debug('Requesting %s', fullUrl);
    return fetch(fullUrl, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    })
      .then((res) => res.json());
  }
}

module.exports = {
  YNAB
};
