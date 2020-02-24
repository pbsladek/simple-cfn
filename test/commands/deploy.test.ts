import {expect, test} from '@oclif/test'

describe('deploy', () => {
  test
  .stdout()
  .command(['deploy', 'stack-name', '/path/to/template'])
  .it('', ctx => {
    expect(ctx.stdout).to.contain('')
  })

  test
  .stdout()
  .command(['deploy', 'stack-name', '/path/to/template'])
  .it('', ctx => {
    expect(ctx.stdout).to.contain('')
  })
})
