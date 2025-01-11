'use client'
import { useEffect, useRef } from 'react'
import lottie from 'lottie-web'

export default function LottieLoader() {
  const container = useRef(null)

  useEffect(() => {
    const instance = lottie.loadAnimation({
      container: container.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: '/lottie/fighter_loading.json'
    })

    return () => instance.destroy()
  }, [])

  return <div ref={container}></div>
}