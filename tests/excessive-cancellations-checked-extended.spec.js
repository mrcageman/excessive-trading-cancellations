/**
 * Note that this file cannot be modified.
 * If you would like to add your own unit tests, please put these in a separate test file.
 */
// Setup
import { ExcessiveCancellationsChecker } from '../excessive-cancellations-checker.js'

const checker = new ExcessiveCancellationsChecker('./data/trades.csv')

describe('excessive Cancellations Test', () => {
  describe('calculate', () => {
    it('outputs the number of companies not involved in excessive cancelling', async () => {
      const wellBehavedCompanies = await checker.totalNumberOfWellBehavedCompanies()

      expect(wellBehavedCompanies).toEqual(12)
    })
  })
})
