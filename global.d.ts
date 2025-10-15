// Global type declarations for CSS imports
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// Specific declaration for @crayonai/react-ui CSS
declare module '@crayonai/react-ui/dist/styles/index.css';
