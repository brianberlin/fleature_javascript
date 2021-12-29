import fleature from './index'

test('enabled and disabled flags', () => {
    fleature.setup({
        enabledFlags: ['enabled_flag'],
    })

    expect(fleature.isEnabled("enabled_flag")).toBe(true)
    expect(fleature.isEnabled("disabled_flag")).toBe(false)
})