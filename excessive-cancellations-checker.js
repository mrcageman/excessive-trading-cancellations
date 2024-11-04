import { createReadStream, existsSync } from 'node:fs'
import neatCsv from 'neat-csv'

async function parseCsv(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`The file at \`filePath\` does not exist: ${filePath}`)
  }

  return neatCsv(createReadStream(filePath), {
    headers: ['dateTime', 'company', 'type', 'amount'],
    mapValues: ({ header, value }) => {
      switch (header) {
        case 'dateTime':
          return Date.parse(new Date(value)) / 1000
        case 'amount':
          return +value
        default:
          return value
      }
    },
  })
}

export class ExcessiveCancellationsChecker {
  /**
   * @type {Array.<string>} offenders
   */
  offenders = []

  /**
   * @typedef Transaction
   * @type {object}
   * @property {number} dateTime - The date of the transaction
   * @property {string} company - The company doing the transaction
   * @property {string} type - F for purchase, D for cancel
   * @property {number} amount - Number of items purchased
   */

  /**
   * @type {Map.<string, Transaction>} tally
   */
  tally = new Map()

  /**
   *  We provide a path to a file when initiating the class
   *  you have to use it in your methods to solve the task
   */
  constructor(filePath) {
    this.filePath = filePath
  }

  isExcessivelyCancelling(company) {
    const transactions = this.tally.get(company)

    let totalCancelled = 0
    let totalPurchased = 0

    for (const transaction of transactions) {
      switch (transaction.type) {
        case 'F':
          totalCancelled += transaction.amount
          break
        case 'D':
          totalPurchased += transaction.amount
          break
      }
    }

    return (totalCancelled / (totalCancelled + totalPurchased)) >= 0.33
  }

  isValidTransaction(transaction) {
    return Object.keys(transaction).length === 4
      && Object.values(transaction).every(value => value !== null && value !== undefined)
  }

  async checkExcessiveCancellations() {
    this.offenders = []
    this.tally.clear()

    const transactions = await parseCsv(this.filePath)

    for (const transaction of transactions) {
      if (
        !this.isValidTransaction(transaction)
        || this.offenders.includes(transaction.company)
      ) {
        continue
      }

      if (!this.tally.has(transaction.company)) {
        this.tally.set(transaction.company, [transaction])
        continue
      }

      this.tally.set(
        transaction.company,
        [
          ...this.tally.get(transaction.company)
            .filter(e => e.dateTime >= (transaction.dateTime - 60)),
          transaction,
        ],
      )

      if (this.isExcessivelyCancelling(transaction.company)) {
        this.offenders.push(transaction.company)
      }
    }
  }

  /**
   * Returns the list of companies that are involved in excessive cancelling.
   * Note this should always resolve an array or throw error.
   */
  async companiesInvolvedInExcessiveCancellations() {
    await this.checkExcessiveCancellations()

    return this.offenders
  }

  /**
   * Returns the total number of companies that are not involved in any excessive cancelling.
   * Note this should always resolve a number or throw error.
   */
  async totalNumberOfWellBehavedCompanies() {
    await this.checkExcessiveCancellations()

    return Array.from(this.tally.keys()).filter(company => !this.offenders.includes(company)).length
  }
}
