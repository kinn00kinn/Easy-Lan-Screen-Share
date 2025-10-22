import React, { useState, useRef, useEffect, useCallback } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import pako from "pako";

const iceServers = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
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

// Uint8ArrayをBase64文字列に変換するヘルパー関数
const uint8ArrayToBase64 = (array) => {
  return btoa(String.fromCharCode.apply(null, array));
};

function ViewScreen() {
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("配信者からの接続情報を待っています...");
  const videoRef = useRef(null);
  const peerConnection = useRef(null);
  // 変更点: 処理が実行済みかを管理するフラグを追加
  const isOfferHandled = useRef(false);

  const handleOffer = useCallback(async (encodedOffer) => {
    // 変更点: 既に処理が開始されていたら、何もしないで終了
    if (isOfferHandled.current) {
      return;
    }
    // 変更点: 処理を開始したことをフラグに記録
    isOfferHandled.current = true;

    try {
      setStatus("接続情報を確認中...");
      peerConnection.current = new RTCPeerConnection(iceServers);

      peerConnection.current.ontrack = (event) => {
        if (videoRef.current) {
          videoRef.current.srcObject = event.streams[0];
          setStatus("接続完了！視聴中です。");
        }
      };

      const compressedSdp = base64ToUint8Array(encodedOffer);
      const offerSdp = pako.inflate(compressedSdp, { to: "string" });

      const offer = new RTCSessionDescription({ type: "offer", sdp: offerSdp });
      await peerConnection.current.setRemoteDescription(offer);

      const createdAnswer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(createdAnswer);

      peerConnection.current.onicegatheringstatechange = () => {
        if (peerConnection.current.iceGatheringState === "complete") {
          const answerSdp = peerConnection.current.localDescription.sdp;
          const compressedAnswer = pako.deflate(answerSdp);
          setAnswer(uint8ArrayToBase64(compressedAnswer));
          setStatus("生成された返信コードを配信者に送ってください");
        }
      };
    } catch (error) {
      console.error("Offerの処理に失敗しました:", error);
      setStatus(`接続情報の処理に失敗しました: ${error.message}`);
    }
  }, []);

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash) {
      handleOffer(hash);
    }
  }, [handleOffer]);

  useEffect(() => {
    if (window.location.hash) return;

    let scanner;
    try {
      scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      const onScanSuccess = (decodedText, decodedResult) => {
        // スキャナーを停止させてから処理を開始
        if (scanner.getState() === 2) {
          // 2: SCANNING
          scanner.clear();
        }
        const url = new URL(decodedText);
        const hash = url.hash.substring(1);
        if (hash) {
          handleOffer(hash);
        }
      };

      scanner.render(onScanSuccess);
    } catch (error) {
      console.log("QR Scanner init error:", error);
    }

    return () => {
      if (scanner && scanner.getState() === 2) {
        scanner
          .clear()
          .catch((err) => console.error("Scanner clear failed", err));
      }
    };
  }, [handleOffer]);

  return (
    <div>
      <h1>視聴モード</h1>
      <video ref={videoRef} autoPlay playsInline />

      {!answer ? (
        <>
          <p className="status">{status}</p>
          {!window.location.hash && (
            <div id="qr-reader" className="scanner-container" />
          )}
        </>
      ) : (
        <div className="step">
          <h2 className="step-title">返信コードを配信者に送ってください</h2>
          <textarea className="code-box" value={answer} readOnly />
          <button
            onClick={() => navigator.clipboard.writeText(answer)}
            className="button primary-button"
            style={{ marginTop: "1rem" }}
          >
            コードをコピー
          </button>
        </div>
      )}
    </div>
  );
}

export default ViewScreen;
