# YNAB Reconciler

Intention: build a tool to make reconciling an account easier. Grab a CSV from your bank and compare against the transactions in YNAB.

## Setup

```
nvm use && yarn install
```

You will need a personal YNAB access token which you can get from settings in YNAB. This can then be set in an `.env` file:

```
YNAB_TOKEN=asdf
```

## Usage

```
node index.js --csv=example.csv
node index.js --csv=example.csv --budget=UUID --account=UUID
```

### Flags

`--csv`: CSV file to parse

`--budget`, `YNAB_BUDGET`: budget ID to use

`--account`, `YNAB_ACCOUNT`: account ID to use

## Debug

```
DEBUG=ynab-reconciler:* node index.js
```
