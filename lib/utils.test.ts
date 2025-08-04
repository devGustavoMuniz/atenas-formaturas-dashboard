import { formatCurrency, formatNumber } from './utils'

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

describe('formatNumber', () => {
  it('deve formatar um número inteiro grande', () => {
    expect(formatNumber(1000000)).toBe('1.000.000')
  })

  it('deve formatar um número com casas decimais', () => {
    // Intl.NumberFormat por padrão não formata decimais, a menos que especificado.
    // O comportamento padrão é arredondar.
    expect(formatNumber(1234.56)).toBe('1.235')
  })

  it('deve formatar o número 0', () => {
    expect(formatNumber(0)).toBe('0')
  })

  it('deve formatar um número negativo', () => {
    expect(formatNumber(-5000)).toBe('-5.000')
  })
})
