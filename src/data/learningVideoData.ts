type LearningVideoLevel = '입문' | '중급' | '심화'

type LearningVideoSource = {
  id: string
  title: string
  description: string
  youtubeUrl: string
  level: LearningVideoLevel
}

export type LearningVideo = LearningVideoSource & {
  youtubeId: string
  embedUrl: string
  watchUrl: string
  thumbnailUrl: string
}

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/

function normalizeYouTubeId(value: string | null | undefined): string | null {
  if (!value) {
    return null
  }

  return YOUTUBE_ID_PATTERN.test(value) ? value : null
}

export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsedUrl = new URL(url)
    const hostname = parsedUrl.hostname.replace(/^www\./, '')

    if (hostname === 'youtu.be') {
      const shortId = parsedUrl.pathname.split('/').filter(Boolean)[0]
      return normalizeYouTubeId(shortId)
    }

    if (
      hostname === 'youtube.com' ||
      hostname === 'm.youtube.com' ||
      hostname === 'music.youtube.com'
    ) {
      if (parsedUrl.pathname === '/watch') {
        return normalizeYouTubeId(parsedUrl.searchParams.get('v'))
      }

      if (parsedUrl.pathname.startsWith('/shorts/') || parsedUrl.pathname.startsWith('/embed/')) {
        const [, , idFromPath] = parsedUrl.pathname.split('/')
        return normalizeYouTubeId(idFromPath)
      }
    }

    if (hostname === 'youtube-nocookie.com' && parsedUrl.pathname.startsWith('/embed/')) {
      const [, , idFromPath] = parsedUrl.pathname.split('/')
      return normalizeYouTubeId(idFromPath)
    }

    return null
  } catch {
    return null
  }
}

function buildLearningVideo(source: LearningVideoSource): LearningVideo {
  const youtubeId = extractYouTubeVideoId(source.youtubeUrl)

  if (!youtubeId) {
    throw new Error(`잘못된 YouTube 링크입니다: ${source.youtubeUrl}`)
  }

  return {
    ...source,
    youtubeId,
    embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}`,
    watchUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`,
  }
}

// 새 영상을 추가할 때는 이 배열에 항목만 추가하면 UI 목록과 플레이어에 자동 반영됩니다.
const learningVideoSources: LearningVideoSource[] = [
  {
    id: 'solar-system-intro-001',
    title: '태양계 기본 개념 소개',
    description: '태양계의 구성과 행성 특징을 짧게 훑어보는 입문 영상',
    youtubeUrl: 'https://youtu.be/TD7Qzxy-S0U',
    level: '입문',
  },
]

export const learningVideos = learningVideoSources.map(buildLearningVideo)
