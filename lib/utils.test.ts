import { formatCurrency } from './utils'

describe('formatCurrency', () => {
  it('deve formatar um número positivo para a moeda brasileira', () => {
    expect(formatCurrency(1234.56)).toBe('R$ 1.234,56')
  })

  it('deve formatar o número 0 corretamente', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00')
  })

  it('deve lidar com números negativos', () => {
    expect(formatCurrency(-500)).toBe('-R$ 500,00')
  })

  it('deve formatar um número sem casas decimais', () => {
    expect(formatCurrency(1000)).toBe('R$ 1.000,00')
  })
})
