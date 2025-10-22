import React, { useState, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import pako from "pako";

const iceServers = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

// Uint8ArrayをBase64文字列に変換するヘルパー関数
const uint8ArrayToBase64 = (array) => {
  return btoa(String.fromCharCode.apply(null, array));
};

// Base64文字列をUint8Arrayに変換するヘルパー関数
const base64ToUint8Array = (base64) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

function ShareScreen() {
  const [offerUrl, setOfferUrl] = useState("");
  const [status, setStatus] = useState("待機中...");
  const peerConnection = useRef(null);

  const startSharing = useCallback(async () => {
    try {
      setStatus("画面を選択中...");
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      setStatus("接続準備中...");

      peerConnection.current = new RTCPeerConnection(iceServers);

      stream.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, stream);
      });

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate === null) {
          const offerSdp = peerConnection.current.localDescription.sdp;
          const compressedSdp = pako.deflate(offerSdp);
          const encodedOffer = uint8ArrayToBase64(compressedSdp);

          // --- 変更点: HashRouter形式のURLを生成 ---
          const baseUrl = window.location.href.split("#")[0];
          const url = `${baseUrl}#/view#${encodedOffer}`;
          // --- 変更点ここまで ---

          setOfferUrl(url);
          setStatus("QRコードを視聴者にスキャンさせてください");
        }
      };

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
    } catch (error) {
      console.error("画面共有の開始に失敗しました:", error);
      setStatus("エラーが発生しました");
    }
  }, []);

  // --- 変更点: ここから ---
  // handleAnswerSubmit関数を修正して、pakoによる解凍処理を追加
  const handleAnswerSubmit = useCallback(async (encodedAnswer) => {
    try {
      // 1. Base64をデコードして圧縮済みのバイナリデータに戻す
      const compressedAnswer = base64ToUint8Array(encodedAnswer);
      // 2. データを解凍して元のSDP文字列に戻す
      const answerSdp = pako.inflate(compressedAnswer, { to: "string" });

      const answer = new RTCSessionDescription({
        type: "answer",
        sdp: answerSdp,
      });
      await peerConnection.current.setRemoteDescription(answer);
      setStatus("接続完了！配信中です。");
    } catch (error) {
      console.error("Answerの設定に失敗しました:", error);
      setStatus(`Answerの設定に失敗しました: ${error.message}`);
    }
  }, []);
  // --- 変更点: ここまで ---

  return (
    <div>
      <h1>配信モード</h1>
      {!offerUrl ? (
        <div style={{ textAlign: "center" }}>
          <button onClick={startSharing} className="button primary-button">
            画面共有を開始
          </button>
          <p className="status">{status}</p>
        </div>
      ) : (
        <>
          <div className="step">
            <h2 className="step-title">
              STEP 1: 視聴者にURLまたはQRコードを共有
            </h2>
            <p>
              このURLをコピーするか、QRコードをスキャンしてもらってください。
            </p>
            <textarea className="code-box" value={offerUrl} readOnly />
            <div className="qr-container">
              <QRCodeSVG value={offerUrl} size={256} />
            </div>
          </div>

          <div className="step">
            <h2 className="step-title">
              STEP 2: 視聴者から送られたコードを入力
            </h2>
            <p>
              視聴者の画面に表示された返信コードをここに貼り付けてください。
            </p>
            <textarea
              className="code-box"
              placeholder="返信コードをここにペースト..."
              onPaste={(e) =>
                handleAnswerSubmit(e.clipboardData.getData("text"))
              }
            />
          </div>
          <p className="status">{status}</p>
        </>
      )}
    </div>
  );
}

export default ShareScreen;
