// emlog リマインドプッシュ送信 — Vercel Serverless Function
// Vercel Cron から毎日呼ばれ、登録済みの端末へ「中身なし」のプッシュを送る。
// 通知の文面は端末側の Service Worker が表示する（暗号化処理が不要になるので
// 外部ライブラリなし・Node 標準の crypto だけで完結する）。
//
// 必要な環境変数（Vercel ダッシュボードで設定）:
//   VAPID_PUBLIC_KEY   … 公開鍵（base64url, 87文字くらい）
//   VAPID_PRIVATE_KEY  … 秘密鍵（base64url, 43文字くらい）
//   VAPID_SUBJECT      … mailto:あなたのメールアドレス
//   PUSH_SUBSCRIPTION  … アプリの設定画面でコピーした購読情報(JSON)
//   CRON_SECRET        … (任意) 設定すると Cron 以外からの実行を拒否できる

const crypto = require('crypto');

const b64url = (buf) => Buffer.from(buf).toString('base64url');

// VAPID 用の署名付きトークン(JWT)を作る。「この送信者は本物です」の証明書。
function vapidJwt(audience, subject, publicKey, privateKey) {
  const header = b64url(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const payload = b64url(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: subject,
  }));
  const unsigned = `${header}.${payload}`;
  // 公開鍵は 0x04 + x(32byte) + y(32byte) の65byte形式
  const pub = Buffer.from(publicKey, 'base64url');
  const jwk = {
    kty: 'EC', crv: 'P-256',
    x: b64url(pub.subarray(1, 33)),
    y: b64url(pub.subarray(33, 65)),
    d: privateKey,
  };
  const key = crypto.createPrivateKey({ key: jwk, format: 'jwk' });
  const sig = crypto.sign('sha256', Buffer.from(unsigned), { key, dsaEncoding: 'ieee-p1363' });
  return `${unsigned}.${b64url(sig)}`;
}

module.exports = async (req, res) => {
  const {
    VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT,
    PUSH_SUBSCRIPTION, CRON_SECRET,
  } = process.env;

  if (CRON_SECRET && req.headers['authorization'] !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !PUSH_SUBSCRIPTION) {
    return res.status(500).json({
      error: 'missing env vars',
      hint: 'VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / PUSH_SUBSCRIPTION を Vercel の環境変数に設定してください',
    });
  }

  let sub;
  try { sub = JSON.parse(PUSH_SUBSCRIPTION); } catch (e) {
    return res.status(500).json({ error: 'PUSH_SUBSCRIPTION が JSON として読めません' });
  }
  if (!sub.endpoint) {
    return res.status(500).json({ error: 'PUSH_SUBSCRIPTION に endpoint がありません' });
  }

  const audience = new URL(sub.endpoint).origin;
  const jwt = vapidJwt(
    audience,
    VAPID_SUBJECT || 'mailto:push@example.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );

  // 本文なし(ペイロードなし)のプッシュ。端末を起こす合図だけを送る。
  const r = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
      'TTL': '86400',
      'Content-Length': '0',
    },
  });
  const detail = await r.text();

  // 410 Gone = 購読が無効化された(アプリ削除など)。再登録が必要。
  return res.status(200).json({
    sentTo: audience,
    pushStatus: r.status,
    ok: r.status === 200 || r.status === 201,
    needsResubscribe: r.status === 404 || r.status === 410,
    detail: detail.slice(0, 300),
  });
};
