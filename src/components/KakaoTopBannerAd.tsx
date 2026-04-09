import { useEffect, useRef, useState } from 'react'

const KAKAO_AD_SCRIPT_SELECTOR = 'script[data-kakao-ad-script="true"]'
const KAKAO_AD_SCRIPT_SRC = '//t1.daumcdn.net/kas/static/ba.min.js'

export function KakaoTopBannerAd() {
  const adRef = useRef<HTMLDivElement>(null)
  const [isRendered, setIsRendered] = useState(false)

  useEffect(() => {
    const existingScript = document.querySelector<HTMLScriptElement>(KAKAO_AD_SCRIPT_SELECTOR)

    if (existingScript) {
      return undefined
    }

    const script = document.createElement('script')
    script.async = true
    script.type = 'text/javascript'
    script.src = KAKAO_AD_SCRIPT_SRC
    script.dataset.kakaoAdScript = 'true'
    document.body.appendChild(script)

    return undefined
  }, [])

  useEffect(() => {
    const adElement = adRef.current?.querySelector('.kakao_ad_area')

    if (!adElement) {
      return undefined
    }

    const syncRenderedState = () => {
      const hasEmbeddedAd = adElement.childElementCount > 0
      const isVisible = window.getComputedStyle(adElement).display !== 'none'
      setIsRendered(hasEmbeddedAd || isVisible)
    }

    syncRenderedState()

    const observer = new MutationObserver(syncRenderedState)
    observer.observe(adElement, {
      attributes: true,
      childList: true,
      subtree: true,
    })

    const timeoutId = window.setTimeout(syncRenderedState, 2000)

    return () => {
      observer.disconnect()
      window.clearTimeout(timeoutId)
    }
  }, [])

  return (
    <section
      className={`topBannerAdShell ${isRendered ? 'isRendered' : 'isPending'}`}
      aria-label="카카오 광고"
    >
      <div ref={adRef} className="topBannerAdFrame">
        <ins
          className="kakao_ad_area"
          style={{ display: 'none' }}
          data-ad-unit="DAN-pZ09G0UhCdii4sWQ"
          data-ad-width="728"
          data-ad-height="90"
        />
      </div>
    </section>
  )
}
