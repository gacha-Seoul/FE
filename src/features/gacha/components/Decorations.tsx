/** 배경 장식: 구름, 전통 문양 (pointer-events 없음) */
export default function Decorations({ clouds = true }: { clouds?: boolean }) {
  return (
    <div className="decorations" aria-hidden>
      <img
        className="abs"
        src="/assets/deco-left.png"
        alt=""
        style={{ left: 0, top: 80, width: 144, height: 710 }}
      />
      <img
        className="abs"
        src="/assets/deco-right.png"
        alt=""
        style={{ left: 1139, top: 233, width: 141, height: 579 }}
      />
      {clouds && (
        <>
          {/* Vector 10 / 11 / 13 (스트로크 여백 포함 크기) */}
          <img
            className="abs"
            src="/assets/cloud-10.svg"
            alt=""
            style={{ left: 57.5, top: 304.5 }}
          />
          <img
            className="abs"
            src="/assets/cloud-11.svg"
            alt=""
            style={{ left: 128.06, top: 444.84 }}
          />
          <img
            className="abs"
            src="/assets/cloud-13.svg"
            alt=""
            style={{ left: 646.34, top: 378.84, transform: 'scaleX(-1)' }}
          />
        </>
      )}
    </div>
  )
}
