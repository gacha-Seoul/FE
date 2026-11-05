import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { PhraseCard } from '../api/types'

/** POST /api/quests/{id}/phrase-card */
export function PhraseCardModal({
  userId,
  questId,
  onClose,
  onError,
}: {
  userId: number
  questId: number
  onClose: () => void
  onError: (msg: string) => void
}) {
  const [card, setCard] = useState<PhraseCard | null>(null)

  useEffect(() => {
    api
      .phraseCard(questId, userId)
      .then(setCard)
      .catch((e) => {
        onError(e.message)
        onClose()
      })
  }, [questId, userId, onClose, onError])

  return (
    <div className="overlay is-center" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {!card ? (
          <p className="modal__loading">표현 카드 만드는 중…</p>
        ) : (
          <>
            <h2 className="modal__title">{card.title}</h2>
            <ul className="phrases">
              {card.phrases.map((p, i) => (
                <li key={i}>
                  <p className="phrases__ko">{p.korean}</p>
                  {p.romanization && <p className="phrases__rom">{p.romanization}</p>}
                  {p.meaning && <p className="phrases__meaning">{p.meaning}</p>}
                  <p className="phrases__when">{p.whenToUse}</p>
                </li>
              ))}
            </ul>
          </>
        )}
        <button className="paper-button" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  )
}

/** 장소 완료 / 지역 정복 — Figma 2-2 ("‘서대문구’ 완료!" + 가챠 >) 구성 */
export function ClearModal({ title, onGacha, onStay }: { title: string; onGacha: () => void; onStay: () => void }) {
  return (
    <div className="overlay is-center">
      <div className="clear">
        <img className="clear__character" src="/assets/character.svg" alt="" />
        <p className="clear__title">‘{title}’ 완료!</p>
        <div className="clear__actions">
          <button className="paper-button" onClick={onStay}>
            계속 둘러보기
          </button>
          <button className="paper-button is-primary" onClick={onGacha}>
            가챠 &gt;
          </button>
        </div>
      </div>
    </div>
  )
}
