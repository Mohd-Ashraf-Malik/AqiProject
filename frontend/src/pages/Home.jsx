import React, { useContext } from 'react'
import Hero from '../components/Hero'
import OurPolicy from '../components/OurPolicy';
import NewsletterBox from '../components/NewsletterBox';

const Home = () => {
  return (
    <div>
      <Hero/>
      <OurPolicy/>
      <NewsletterBox/>
    </div>
  )
}

export default Home
