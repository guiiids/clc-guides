import { Roboto } from 'next/font/google'
import './globals.css'

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto',
  display: 'swap',
})

export const metadata = {
  title: 'Agilent CrossLab Connect — Help Center',
  description: 'User guides and documentation for Agilent CrossLab Connect.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={roboto.variable}>
      <body>{children}</body>
    </html>
  )
}
