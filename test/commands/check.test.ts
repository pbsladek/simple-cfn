import {expect, test} from '@oclif/test'

describe('check', () => {
  test
  .stdout()
  .command(['check', '/path/to/template'])
  .it('', ctx => {
    expect(ctx.stdout).to.contain('')
  })
})
