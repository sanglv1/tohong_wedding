'use client'

import { useEffect } from 'react'

/** Nền trang cưới đang là màu rượu vang; các trang thiệp cần nền giấy sáng, kể cả lúc kéo quá đầu trang */
export function PlatformBody() {
  useEffect(() => {
    const { body } = document
    const previousBackground = body.style.background
    const previousColor = body.style.color
    body.style.background = '#f3efe7'
    body.style.color = '#1c1917'
    return () => {
      body.style.background = previousBackground
      body.style.color = previousColor
    }
  }, [])
  return null
}
