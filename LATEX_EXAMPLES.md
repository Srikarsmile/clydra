# LaTeX Math Equation Examples

The following LaTeX equations should now render properly in chat messages:

## Inline Math
- Simple variable: `$x = 5$`
- Fraction: `$\frac{1}{2}$`
- Square root: `$\sqrt{2}$`
- Greek letters: `$\alpha + \beta = \gamma$`

## Display Math (Block Equations)

### Quadratic Formula
```
$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$
```

### Einstein's Mass-Energy Equivalence
```
$$E = mc^2$$
```

### Euler's Identity
```
$$e^{i\pi} + 1 = 0$$
```

### Matrix Example
```
$$\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}$$
```

### Integral
```
$$\int_0^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$$
```

### Summation
```
$$\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}$$
```

## Testing Instructions

1. Copy any of the above equations
2. Paste them into a chat message
3. The LaTeX should render as beautiful mathematical notation

## Model Testing

Now working models include:
- **Llama 3.3 70B** - Mapped to `meta-llama/llama-3.3-70b-instruct` on OpenRouter
- **Mistral Small** - Mapped to `mistralai/mistral-small-latest` on OpenRouter  
- **Sarvam M** - Mapped to `qwen/qwen-2.5-7b-instruct` on OpenRouter

## Code Block Improvements

Code blocks now have:
- Language detection and labeling
- Copy-to-clipboard buttons
- Better syntax highlighting for LaTeX, Python, JavaScript, etc.
- Hover effects for better UX

Example:
```latex
\documentclass{article}
\begin{document}
$$\int_0^1 x^2 dx = \frac{1}{3}$$
\end{document}
```

## Supported Syntax

- Inline math: `$...$`
- Display math: `$$...$$`
- All standard LaTeX math commands
- Greek letters, fractions, integrals, summations, matrices, etc.
- Enhanced code block rendering with copy functionality