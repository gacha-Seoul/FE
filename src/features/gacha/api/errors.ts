/** 서버 오류는 {"message": "설명"} 형식. status로 분기 (0 연결 실패 / 400 입력·코인 부족 / 403 미해금 / 404 없음 / 409 순서·이미 완료) */
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}
