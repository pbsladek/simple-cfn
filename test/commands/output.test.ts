import {expect, test} from '@oclif/test'

describe('output', () => {
  test
  .stdout()
  .command(['output', 'stack-name', '--query', 'dev'])
  .it('', ctx => {
    expect(ctx.stdout).to.contain('')
  })

  test
  .stdout()
  .command(['output', 'stack-name', '--query', 'dev'])
  .it('', ctx => {
    expect(ctx.stdout).to.contain('')
  })
})
