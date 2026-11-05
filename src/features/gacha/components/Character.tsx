/** 도깨비불 캐릭터 (node 126:677). 글로우 여백 포함 크기 */
export default function Character({ raised = false }: { raised?: boolean }) {
  return (
    <img
      className={`abs character ${raised ? 'is-raised' : ''}`}
      src={raised ? '/assets/popup-capsule.svg' : '/assets/character.svg'}
      alt="가이드 캐릭터"
      style={raised ? { left: 1021, top: 650.29 } : { left: 974.46, top: 587.22 }}
    />
  )
}
