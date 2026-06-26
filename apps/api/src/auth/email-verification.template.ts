export function generateVerificationEmailHtml(code: string): string {

  return `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <link
      href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap"
      rel="stylesheet"
    />
  </head>
  <body style="margin:0;padding:20px;background:#f4f0e8;font-family:'Noto Sans KR',sans-serif">
    <div style="max-width:520px;margin:0 auto;background:#f9f5ee;border-radius:12px;overflow:hidden;border:1px solid #d6cdb8">
      <div style="background:#1a3628;padding:28px 40px;text-align:center">
        <p style="color:#f9f5ee;font-size:25px;font-weight:500;letter-spacing:0.06em;margin:0 0 4px">책의 숲</p>
        <p style="color:#7ec8a4;font-size:15px;margin:0;letter-spacing:0.1em;font-style:italic">Forest of Books</p>
      </div>
      <div style="padding:40px;text-align:center">
        <p style="color:#2d4a3e;font-size:18px;margin:0 0 4px;line-height:1.8">
          이메일 주소 확인을 위한 인증 코드입니다.
        </p>
        <p style="color:#7a8f85;font-size:15px;margin:0 0 32px;line-height:1.8">
          10분 안에 입력하지 않으면 코드가 만료됩니다.
        </p>
        <div style="background:#f0ebe0;border:1.5px solid #c8bfa8;border-radius:10px;padding:28px 32px;display:inline-block;min-width:260px">
          <p style="color:#7a6e5e;font-size:15px;letter-spacing:0.12em;margin:0 0 12px;text-transform:uppercase">
            인증 코드
          </p>
          <div title="클릭하면 코드가 선택됩니다" style="display:flex;justify-content:center;align-items:center;cursor:pointer;user-select:all">
            <span style="font-size:38px;font-weight:700;color:#1a3628;line-height:1;letter-spacing:0.25em;font-family:'Noto Sans KR',sans-serif">${code}</span>
          </div>
        </div>
        <p style="color:#7a8f85;font-size:15px;line-height:1.8;margin:32px 0 0">
          본인이 요청하지 않은 경우 이 메일을 무시하셔도 됩니다.<br />
          계정 보안을 위해 코드를 타인과 공유하지 마세요.
        </p>
      </div>
    </div>
  </body>
</html>`;
}
