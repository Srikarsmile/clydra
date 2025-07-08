import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';

interface MathRendererProps {
  content: string;
}

const MathRenderer: React.FC<MathRendererProps> = ({ content }) => {
  // Split content by math expressions
  const renderMath = (text: string) => {
    const parts: (string | React.ReactElement)[] = [];
    let currentIndex = 0;

    // Handle display math ($$...$$) first
    const displayMathRegex = /\$\$([^$]+)\$\$/g;
    let match;
    
    while ((match = displayMathRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > currentIndex) {
        const beforeText = text.slice(currentIndex, match.index);
        parts.push(...renderInlineMath(beforeText, parts.length));
      }
      
      // Add the display math
      try {
        parts.push(
          <BlockMath key={parts.length} math={match[1].trim()} />
        );
      } catch {
        // Fallback to raw text if KaTeX fails
        parts.push(`$$${match[1]}$$`);
      }
      
      currentIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex);
      parts.push(...renderInlineMath(remainingText, parts.length));
    }
    
    return parts;
  };

  // Handle inline math ($...$) 
  const renderInlineMath = (text: string, startKey: number) => {
    const parts: (string | React.ReactElement)[] = [];
    let currentIndex = 0;

    // More restrictive regex to avoid conflicts with display math
    const inlineMathRegex = /(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/g;
    let match;
    
    while ((match = inlineMathRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > currentIndex) {
        parts.push(text.slice(currentIndex, match.index));
      }
      
      // Add the inline math
      try {
        parts.push(
          <InlineMath key={startKey + parts.length} math={match[1].trim()} />
        );
      } catch {
        // Fallback to raw text if KaTeX fails
        parts.push(`$${match[1]}$`);
      }
      
      currentIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (currentIndex < text.length) {
      parts.push(text.slice(currentIndex));
    }
    
    return parts;
  };

  const renderedParts = renderMath(content);
  
  return (
    <>
      {renderedParts.map((part, index) => (
        typeof part === 'string' ? (
          <span key={index}>{part}</span>
        ) : (
          React.cloneElement(part, { key: index })
        )
      ))}
    </>
  );
};

export default MathRenderer;