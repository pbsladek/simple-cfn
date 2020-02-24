import {expect, test} from '@oclif/test'

describe('search', () => {
  test
  .stdout()
  .command(['search', 'stack-name', '--query', 'dev'])
  .it('', ctx => {
    expect(ctx.stdout).to.contain('')
  })

  test
  .stdout()
  .command(['search', 'stack-name', '--query', 'dev'])
  .it('', ctx => {
    expect(ctx.stdout).to.contain('')
  })
})
