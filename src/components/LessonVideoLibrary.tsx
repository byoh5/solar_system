import { useMemo, useState } from 'react'
import { learningVideos } from '../data/learningVideoData'

type LessonVideoLibraryProps = {
  compact?: boolean
}

export function LessonVideoLibrary({ compact = false }: LessonVideoLibraryProps) {
  const [selectedVideoId, setSelectedVideoId] = useState(learningVideos[0]?.id ?? '')
  const [query, setQuery] = useState('')

  const normalizedQuery = query.trim().toLowerCase()

  const filteredVideos = useMemo(() => {
    if (!normalizedQuery) {
      return learningVideos
    }

    return learningVideos.filter((video) => {
      const searchTarget = `${video.title} ${video.description} ${video.level}`.toLowerCase()
      return searchTarget.includes(normalizedQuery)
    })
  }, [normalizedQuery])

  const selectedVideo =
    learningVideos.find((video) => video.id === selectedVideoId) ?? learningVideos[0] ?? null

  return (
    <section className={`videoDock ${compact ? 'compact' : ''}`} aria-label="태양계 학습 영상">
      <div className="videoDockHeader">
        <div className="videoDockTitle">
          <p className="videoDockEyebrow">Learning Videos</p>
          <h2>태양계 학습 영상</h2>
        </div>
        <span className="videoCountBadge">총 {learningVideos.length}개</span>
      </div>

      <div className="videoDockBody">
        <article className="videoPlayerCard">
          {selectedVideo ? (
            <>
              <div className="videoFrame">
                <iframe
                  src={selectedVideo.embedUrl}
                  title={`${selectedVideo.title} 재생`}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>

              <div className="videoMeta">
                <p className="videoLevel">{selectedVideo.level}</p>
                <h3>{selectedVideo.title}</h3>
                <p>{selectedVideo.description}</p>
                <a href={selectedVideo.watchUrl} target="_blank" rel="noreferrer">
                  YouTube에서 열기
                </a>
              </div>
            </>
          ) : (
            <p className="videoEmptyMessage">등록된 영상이 없습니다.</p>
          )}
        </article>

        <aside className="videoListCard">
          {compact ? (
            <p className="videoListHint">영상 목록</p>
          ) : (
            <>
              <label className="videoSearchLabel" htmlFor="video-search">
                영상 검색
              </label>
              <input
                id="video-search"
                className="videoSearchInput"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="제목, 설명, 난이도로 검색"
              />
            </>
          )}

          {filteredVideos.length === 0 ? (
            <p className="videoEmptyMessage">검색 결과가 없습니다.</p>
          ) : (
            <ul className="videoList">
              {filteredVideos.map((video) => (
                <li key={video.id}>
                  <button
                    type="button"
                    className={`videoListItem ${video.id === selectedVideo?.id ? 'active' : ''}`}
                    onClick={() => setSelectedVideoId(video.id)}
                  >
                    <img
                      src={video.thumbnailUrl}
                      alt={`${video.title} 썸네일`}
                      width={96}
                      height={54}
                      loading="lazy"
                    />
                    <div>
                      <strong>{video.title}</strong>
                      <span>{video.level}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </section>
  )
}
