import {expect, test} from '@oclif/test'

describe('change', () => {
  test
  .stdout()
  .command(['change', 'stack-name', '/path/to/template'])
  .it('', ctx => {
    expect(ctx.stdout).to.contain('')
  })

  test
  .stdout()
  .command(['change', 'stack-name', '/path/to/template'])
  .it('', ctx => {
    expect(ctx.stdout).to.contain('')
  })
})
