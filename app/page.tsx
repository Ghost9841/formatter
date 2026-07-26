import Link from 'next/link'
import React from 'react'

const Home = () => {
  return (
    <div>
      <Link href="/korean">Korean</Link>
      <br />
      <Link href="/nepali">Nepali</Link>
    </div>
  )
}

export default Home
