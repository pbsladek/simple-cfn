import {expect, test} from '@oclif/test'

describe('exists', () => {
  test
  .stdout()
  .command(['exists', 'stack-name'])
  .it('', ctx => {
    expect(ctx.stdout).to.contain('')
  })

  test
  .stdout()
  .command(['exists', 'stack-name'])
  .it('', ctx => {
    expect(ctx.stdout).to.contain('')
  })
})
