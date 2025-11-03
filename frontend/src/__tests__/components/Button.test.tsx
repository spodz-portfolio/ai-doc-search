import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../components/Button';

describe('Button Component', () => {
  it('should render button with children', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} disabled>Click me</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });

  it('should not call onClick when loading', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} loading>Click me</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });

  it('should show loading state correctly', () => {
    render(<Button loading>Click me</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Loading...');
    expect(button.querySelector('.spinner')).toBeInTheDocument();
  });

  it('should apply variant classes correctly', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('btn-primary');

    rerender(<Button variant="secondary">Secondary</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('btn-secondary');

    rerender(<Button variant="danger">Danger</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('btn-danger');

    rerender(<Button variant="success">Success</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('btn-success');
  });

  it('should apply size classes correctly', () => {
    const { rerender } = render(<Button size="small">Small</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('btn-small');

    rerender(<Button size="medium">Medium</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('btn-medium');

    rerender(<Button size="large">Large</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('btn-large');
  });

  it('should apply default classes when no variant/size specified', () => {
    render(<Button>Default</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn', 'btn-primary', 'btn-medium');
  });

  it('should apply custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should apply disabled class when disabled or loading', () => {
    const { rerender } = render(<Button disabled>Disabled</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('disabled');

    rerender(<Button loading>Loading</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('disabled');
  });

  it('should set button type correctly', () => {
    const { rerender } = render(<Button type="submit">Submit</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');

    rerender(<Button type="reset">Reset</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'reset');

    rerender(<Button>Default</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('should set title attribute', () => {
    render(<Button title="Button tooltip">Hover me</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Button tooltip');
  });

  it('should handle click without onClick handler', () => {
    render(<Button>No handler</Button>);
    
    const button = screen.getByRole('button');
    
    expect(() => {
      fireEvent.click(button);
    }).not.toThrow();
  });

  it('should render children correctly when not loading', () => {
    render(
      <Button>
        <span data-testid="icon">🚀</span>
        <span>Launch</span>
      </Button>
    );
    
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('Launch')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<Button disabled title="Cannot click">Disabled</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('title', 'Cannot click');
  });

  it('should apply all classes simultaneously', () => {
    render(
      <Button 
        variant="danger" 
        size="large" 
        className="custom-btn" 
        disabled
      >
        Complex Button
      </Button>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass(
      'btn',
      'btn-danger',
      'btn-large',
      'custom-btn',
      'disabled'
    );
  });
});