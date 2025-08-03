import { render, screen } from '@testing-library/react'
import { Badge } from './badge'

describe('Badge Component', () => {
  it('deve renderizar o conteúdo de texto corretamente', () => {
    render(<Badge>Aprovado</Badge>)
    const badgeElement = screen.getByText('Aprovado')
    expect(badgeElement).toBeInTheDocument()
  })

  it('deve aplicar a classe da variante "default" por padrão', () => {
    const { container } = render(<Badge>Default</Badge>)
    expect(container.firstChild).toHaveClass('bg-primary')
  })

  it('deve aplicar a classe da variante "destructive"', () => {
    const { container } = render(<Badge variant="destructive">Destructive</Badge>)
    expect(container.firstChild).toHaveClass('bg-destructive')
  })

  it('deve aplicar a classe da variante "success"', () => {
    const { container } = render(<Badge variant="success">Success</Badge>)
    expect(container.firstChild).toHaveClass('bg-emerald-600')
  })

  it('deve aplicar a classe da variante "secondary"', () => {
    const { container } = render(<Badge variant="secondary">Secondary</Badge>)
    expect(container.firstChild).toHaveClass('bg-secondary')
  })

  it('deve aplicar a classe da variante "outline"', () => {
    const { container } = render(<Badge variant="outline">Outline</Badge>)
    expect(container.firstChild).toHaveClass('text-foreground')
  })
})
