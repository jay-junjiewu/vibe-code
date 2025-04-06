   // src/app/layout.tsx
   import '@/styles/globals.css'; // Import your global styles

   export const metadata = {
     title: 'Vibe generator',
     description: 'Your App Description',
   };

   export default function RootLayout({ children }: { children: React.ReactNode }) {
     return (
       <html lang="en">
         <body>
           {children}
         </body>
       </html>
     );
   }