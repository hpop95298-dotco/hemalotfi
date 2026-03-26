import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('renders with variant', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByRole('button', { name: /delete/i })
    expect(button).toBeInTheDocument()
  })
})