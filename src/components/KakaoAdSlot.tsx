import { useEffect } from 'react'

const KAKAO_AD_SCRIPT_SELECTOR = 'script[data-kakao-ad-script="true"]'
const KAKAO_AD_SCRIPT_SRC = '//t1.daumcdn.net/kas/static/ba.min.js'

export function KakaoAdSlot() {
  useEffect(() => {
    const existingScript = document.querySelector<HTMLScriptElement>(KAKAO_AD_SCRIPT_SELECTOR)

    if (existingScript) {
      return
    }

    const script = document.createElement('script')
    script.async = true
    script.type = 'text/javascript'
    script.src = KAKAO_AD_SCRIPT_SRC
    script.dataset.kakaoAdScript = 'true'
    document.body.appendChild(script)
  }, [])

  return (
    <div className="adPanel">
      <p className="adLabel">광고</p>
      <ins
        className="kakao_ad_area kakaoAdFrame"
        style={{ display: 'none' }}
        data-ad-unit="DAN-ScdoOBuk8c3V8OMO"
        data-ad-width="160"
        data-ad-height="600"
      />
    </div>
  )
}
