import './globals.css'

export const metadata = {
  title: 'AI Chat Interface',
  description: 'Chat with an AI using Next.js and Python',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}