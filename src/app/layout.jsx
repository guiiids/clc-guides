import { Inter, Roboto, Roboto_Condensed } from 'next/font/google'
import './globals.css'
import DevTypographyToggle from '@/components/DevTypographyToggle'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '700', '900'],
  variable: '--font-roboto',
  display: 'swap',
})

const robotoCondensed = Roboto_Condensed({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-roboto-condensed',
  display: 'swap',
})

export const metadata = {
  title: 'Agilent CrossLab Connect — Help Center',
  description: 'User guides and documentation for Agilent CrossLab Connect.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${roboto.variable} ${robotoCondensed.variable}`}>
      <body>
        {children}
        <DevTypographyToggle />
      </body>
    </html>
  )
}
