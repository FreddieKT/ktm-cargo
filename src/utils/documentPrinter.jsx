import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';

/**
 * Renders a React component to a new window and triggers print
 * @param {React.Component} Component - The template component to render
 * @param {Object} props - Props to pass to the component
 */
export function printDocument(Component, props) {
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    console.error('Popup blocked');
    return;
  }

  // Basic HTML structure with Tailwind CDN for styling (since we can't easily bundle styles in a new window without complex setup)
  // In a real prod app, you might want to inline critical CSS or link to your stylesheet
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Document</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @media print {
            @page { margin: 0; }
            body { margin: 1.6cm; }
            .no-print { display: none; }
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body { font-family: 'Inter', sans-serif; }
        </style>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      </head>
      <body>
        <div id="print-root"></div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for resources to load
  printWindow.onload = () => {
    const rootElement = printWindow.document.getElementById('print-root');
    if (rootElement) {
      const root = createRoot(rootElement);

      // Use flushSync to ensure render is complete before printing
      flushSync(() => {
        root.render(<Component {...props} />);
      });

      // Small delay to ensure styles are applied
      setTimeout(() => {
        printWindow.print();
        // Optional: close after print
        // printWindow.close();
      }, 500);
    }
  };
}
