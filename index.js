<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>TikTalk - Stranger Chat</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: Arial, sans-serif;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
    }
    body {
      background: #fff;
      display: flex;
      flex-direction: column;
      height: 100vh;
      transition: background 0.3s, color 0.3s;
      color: #0f172a;
      overflow: hidden;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      overscroll-behavior-y: none;
    }
    body.dark-mode {
      background: #0b0f15;
      color: #e5e7eb;
    }
    header {
      position: fixed !important;
      top: env(safe-area-inset-top);
      left: 0;
      right: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 10px;
      background: #fff;
      z-index: 10003;
      width: 100%;
      box-sizing: border-box;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      border-radius: 0 0 16px 16px;
    }
    body.dark-mode header {
      background: #10161d;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    }
    header .left, header .right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    header svg.logo {
      height: 60px;
      width: auto;
      display: block;
    }
    .chat-wrapper {
      position: relative;
      flex: 1;
      overflow: hidden;
    }
    #chat {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      overflow-y: auto;
      overscroll-behavior: contain;
      contain: strict;
      padding: calc(70px + env(safe-area-inset-top)) 15px calc(70px + env(safe-area-inset-bottom));
      -webkit-overflow-scrolling: touch;
    }
    #messages {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .msg {
      max-width: 75%;
      padding: 10px 14px;
      border-radius: 18px;
      word-wrap: break-word;
      font-size: 15px;
      line-height: 1.4;
      box-shadow: 0 1px 2px rgba(0,0,0,0.06);
      display: inline-block;
    }
    .me {
      align-self: flex-end;
      background: #e6f0ff;
      color: #0f172a;
      border-bottom-right-radius: 6px;
    }
    body.dark-mode .me {
      background: #2a3d66;
      color: #e5e7eb;
    }
    .stranger {
      align-self: flex-start;
      background: #f0f0f5;
      color: #0f172a;
      border-bottom-left-radius: 6px;
    }
    body.dark-mode .stranger {
      background: #2d3748;
      color: #e5e7eb;
    }
    .popup {
      background: transparent;
      border: none;
      padding: 8px;
      text-align: center;
      color: #555;
      max-width: 220px;
      margin: 8px auto;
      font-size: 14px;
    }
    body.dark-mode .popup {
      background: transparent;
      color: #e5e7eb;
    }
    .searching-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 15px 0;
    }
    .pulse-dots {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }
    .pulse-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: linear-gradient(45deg, #00eaff, #6a00ff);
      animation: pulse 1.5s ease-in-out infinite;
      will-change: transform, opacity;
    }
    .pulse-dot:nth-child(1) { animation-delay: 0s; }
    .pulse-dot:nth-child(2) { animation-delay: 0.2s; }
    .pulse-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes pulse {
      0%, 100% { transform: scale(0.8); opacity: 0.7; }
      50% { transform: scale(1.2); opacity: 1; }
    }
    .searching-text {
      margin-left: 10px;
      font-weight: 500;
      color: #555;
      white-space: nowrap;
    }
    body.dark-mode .searching-text {
      color: #e5e7eb;
    }
    #typingIndicator {
      font-size: 13px;
      color: #888;
      margin-top: 15px;
      padding-bottom: 10px;
      text-align: left;
      display: none;
    }
    body.dark-mode #typingIndicator {
      color: #b0b0b0;
    }
    .typing-container {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 6px;
    }
    .typing-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: linear-gradient(45deg, #007bff, #00eaff);
      animation: typingBounce 1.2s ease-in-out infinite;
      will-change: transform, opacity;
    }
    .typing-dot:nth-child(1) { animation-delay: 0s; }
    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes typingBounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
    footer {
      position: fixed !important;
      bottom: calc(10px + env(safe-area-inset-bottom));
      left: 8px;
      right: 8px;
      display: flex;
      align-items: center;
      padding: 6px;
      gap: 8px;
      background: #fff;
      z-index: 10000;
      height: 56px;
      min-height: 56px;
      max-height: 56px;
      overflow: hidden !important;
      -webkit-overflow-scrolling: none;
      contain: strict;
      box-sizing: border-box;
      -webkit-appearance: none;
      border-radius: 35px;
      box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
      transition: bottom 0.3s ease;
    }
    body.dark-mode footer {
      background: #10161d;
      box-shadow: 0 -2px 10px rgba(0,0,0,0.3);
    }
    .footerNote {
      position: fixed;
      bottom: calc(72px + env(safe-area-inset-bottom));
      left: 0;
      right: 0;
      text-align: center;
      font-size: 14px;
      color: #555;
      z-index: 9999;
    }
    body.dark-mode .footerNote {
      color: #e5e7eb;
    }
    .inputWrapper {
      flex: 1;
      flex-grow: 5;
      flex-basis: 0;
      position: relative;
      display: flex;
      align-items: center;
      height: 40px;
      min-height: 40px;
      max-height: 40px;
      overflow: hidden !important;
      box-sizing: border-box;
      background: transparent !important;
    }
    textarea {
      width: 100%;
      resize: none;
      padding: 10px 18px 10px 12px;
      border: 1px solid #ccc !important;
      border-radius: 20px;
      font-size: 14px;
      outline: none;
      height: 40px;
      min-height: 40px;
      max-height: 120px;
      line-height: 18px;
      background: transparent !important;
      color: #0f172a;
      overflow-y: auto !important;
      box-sizing: border-box;
      -webkit-appearance: none;
      z-index: 10002;
      touch-action: manipulation;
    }
    body.dark-mode textarea {
      border: 1px solid #4a5568 !important;
      background: transparent !important;
      color: #e5e7eb;
    }
    #emojiToggle {
      border: none;
      font-size: 20px;
      cursor: pointer;
      line-height: 1;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      -webkit-tap-highlight-color: transparent !important;
      z-index: 10000;
      overflow: hidden;
      pointer-events: auto;
      touch-action: manipulation;
      margin-right: 8px;
      color: #0f172a;
      background: transparent !important;
      box-shadow: none !important;
    }
    body.dark-mode #emojiToggle {
      color: #e5e7eb;
      background: transparent !important;
      box-shadow: none !important;
    }
    #emojiToggle:hover, #emojiToggle:active, #emojiToggle:focus {
      background: transparent !important;
      box-shadow: none !important;
    }
    button {
      padding: 0 14px;
      border: none;
      border-radius: 20px;
      background: #007bff;
      color: #fff;
      font-weight: bold;
      cursor: pointer;
      font-size: 14px;
      white-space: nowrap;
      -webkit-tap-highlight-color: transparent !important;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      touch-action: manipulation;
    }
    button:active {
      opacity: 0.85;
    }
    #sendBtn {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      padding: 0;
      background: #007bff;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      overflow: hidden;
      margin-left: 8px;
      box-shadow: 0 2px 8px rgba(0,123,255,0.4);
    }
    #sendBtn svg {
      width: 24px;
      height: 24px;
    }
    #nextBtn {
      position: fixed;
      bottom: calc(100px + env(safe-area-inset-bottom));
      right: 20px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      padding: 0;
      background: #ff3b30;
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 10002;
      overflow: visible;
      box-shadow: 0 2px 8px rgba(255,59,48,0.4);
      box-sizing: border-box;
    }
    #nextBtn svg {
      width: 24px;
      height: 24px;
      display: block;
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      overflow: visible;
    }
    #emojiPicker {
      position: fixed;
      left: 8px;
      right: 8px;
      margin: 0 auto;
      width: calc(100% - 16px);
      max-width: 400px;
      height: var(--emoji-picker-height, 350px);
      max-height: 50vh;
      overflow-y: auto;
      background: transparent !important;
      border-radius: 16px;
      z-index: 10001;
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      will-change: transform, opacity, bottom;
      display: none;
      transform: translateY(30px) scale(0.98);
      bottom: calc(10px + env(safe-area-inset-bottom));
    }
    #emojiPicker.show {
      opacity: 1;
      transform: translateY(0) scale(1);
      display: block;
      bottom: calc(10px + env(safe-area-inset-bottom));
    }
    body.dark-mode #emojiPicker {
      background: transparent !important;
    }
    .emoji-mart {
      width: 100% !important;
      height: 100% !important;
      overflow-y: auto !important;
      font-family: "Twemoji Mozilla", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", "EmojiOne Color", "Android Emoji", sans-serif !important;
      box-sizing: border-box !important;
      border-radius: 16px;
      background: transparent !important;
    }
    .emoji-mart-scroll {
      overflow-y: auto !important;
      height: auto !important;
    }
    /* न्यू CSS: वीडियो सेक्शन */
    #videoSection {
      display: none;
      padding: 10px;
      text-align: center;
    }
    #localVideo, #remoteVideo {
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      margin: 5px;
      background: #000; /* ब्लैक बैकग्राउंड अगर वीडियो लोड न हो */
    }
    #videoControls {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-top: 10px;
    }
    @media (max-width: 767px) {
      #videoSection {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      #localVideo, #remoteVideo {
        width: 100%;
        max-width: 300px;
        height: 200px;
      }
      #localVideo {
        order: 2; /* नीचे */
      }
      #remoteVideo {
        order: 1; /* ऊपर */
      }
    }
    @media (min-width: 768px) {
      #videoSection {
        display: flex;
        flex-direction: row;
        justify-content: center;
        gap: 20px;
      }
      #localVideo, #remoteVideo {
        width: 320px;
        height: 240px;
      }
      #localVideo {
        order: 1; /* लेफ्ट */
      }
      #remoteVideo {
        order: 2; /* राइट */
      }
      #emojiPicker {
        width: 360px;
        left: auto;
        right: 8px;
        height: var(--emoji-picker-height, 350px);
        max-height: 350px;
        transform: translate(0, 30px) scale(0.98);
        bottom: calc(56px + 10px + env(safe-area-inset-bottom)); /* फूटर के ऊपर */
      }
      #emojiPicker.show {
        transform: translate(0, 0) scale(1);
        display: block;
        bottom: calc(56px + 10px + env(safe-area-inset-bottom));
      }
    }
    @media (max-width: 767px) {
      #emojiPicker {
        height: var(--emoji-picker-height, 350px) !important;
        max-height: 50vh !important;
        bottom: calc(10px + env(safe-area-inset-bottom));
      }
      #emojiPicker.show {
        transform: translate(0, 0) scale(1);
        display: block;
        bottom: calc(10px + env(safe-area-inset-bottom));
      }
    }
    @media (max-width: 480px) {
      .msg {
        max-width: 85%;
        font-size: 14px;
        padding: 8px 12px;
      }
      footer {
        padding: 6px;
        height: 56px;
        min-height: 56px;
        max-height: 56px;
        left: 8px;
        right: 8px;
        border-radius: 32px;
      }
      .inputWrapper {
        height: 40px;
        min-height: 40px;
        max-height: 40px;
      }
      textarea {
        height: 40px;
        min-height: 40px;
        max-height: 120px;
        font-size: 14px;
        padding: 10px 18px 10px 12px;
      }
      #emojiToggle {
        font-size: 18px;
        width: 44px;
        height: 44px;
      }
      #nextBtn {
        width: 44px;
        height: 44px;
        right: 12px;
        bottom: calc(100px + env(safe-area-inset-bottom));
      }
      #sendBtn {
        width: 46px;
        height: 46px;
      }
    }
    .icon-btn {
      width: 28px;
      height: 28px;
      font-size: 20px;
      border-radius: 50%;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      touch-action: manipulation;
      background: transparent !important;
      border: none;
      box-shadow: none !important;
    }
    .icon-btn:active {
      transform: scale(0.95);
    }
    .share-btn {
      padding: 0;
      background: transparent;
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      position: relative;
      color: #fff;
      display: flex !important;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      z-index: 10005;
      visibility: visible;
      opacity: 1;
      overflow: hidden;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    }
    .share-btn svg.button-icon {
      width: 12px;
      height: 12px;
    }
    .share-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    body.dark-mode .share-btn {
      border-color: rgba(255,255,255,0.5);
    }
    body.dark-mode .share-btn:hover {
      border-color: rgba(255,255,255,0.7);
      box-shadow: 0 4px 12px rgba(255,255,255,0.2);
    }
    .right {
      position: relative;
      display: flex !important;
      align-items: center;
      gap: 8px;
      z-index: 10004;
      padding-right: 10px;
    }
    .share-animation {
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10006;
      pointer-events: none;
    }
    .share-animation::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: 50%;
      padding: 2px;
      background: linear-gradient(45deg, #00eaff, #007bff, #6a00ff, #00eaff);
      background-size: 300% 300%;
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      animation: shareBorderAnimation 3s ease infinite;
    }
    @keyframes shareBorderAnimation {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .share-sheet {
      position: absolute;
      top: calc(100% + env(safe-area-inset-top));
      right: 0;
      background: #fff !important;
      border-radius: 12px;
      padding: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      display: none;
      flex-direction: row;
      gap: 12px;
      z-index: 10006;
      margin-top: 5px;
      transform: translateY(-10px);
      opacity: 0;
      transition: all 0.3s ease;
    }
    body.dark-mode .share-sheet {
      background: #1f2937 !important;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    }
    .share-sheet.show {
      transform: translateY(0);
      opacity: 1;
    }
    .share-sheet button {
      background: #f8f9fa !important;
      border: 1px solid #dee2e6 !important;
      border-radius: 50%;
      padding: 8px;
      width: 44px;
      height: 44px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      z-index: 10001;
    }
    .share-sheet button:hover {
      background: #e9ecef !important;
      transform: scale(1.05);
    }
    body.dark-mode .share-sheet button {
      background: #2d3748 !important;
      border-color: #4a5568 !important;
    }
    body.dark-mode .share-sheet button:hover {
      background: #4a5568 !important;
    }
    .share-sheet button img {
      width: 24px;
      height: 24px;
    }
    .share-sheet button svg {
      display: block;
    }
    .share-sheet .link {
      border-radius: 50%;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8f9fa !important;
      border: 1px solid #dee2e6 !important;
      color: #007bff !important;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .share-sheet .link:hover {
      background: #e9ecef !important;
      transform: scale(1.05);
    }
    button:focus, button:active,
    .icon-btn:focus, .icon-btn:active,
    .share-btn:focus, .share-btn:active,
    .share-sheet button:focus, .share-sheet button:active,
    button:focus-visible, .icon-btn:focus-visible,
    .share-btn:focus-visible, .share-sheet button:focus-visible {
      outline: none !important;
      box-shadow: none !important;
    }
    #copyLinkPopup {
      position: absolute;
      top: calc(100% + 15px);
      right: 0;
      padding: 12px 20px;
      border-radius: 25px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      font-size: 14px;
      font-weight: 600;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 10007;
      pointer-events: none;
      color: #fff;
      background: #007bff;
      transform: translateY(-10px);
    }
    #copyLinkPopup.show {
      opacity: 1;
      transform: translateY(0);
    }
    body.dark-mode #copyLinkPopup {
      background: #1d4ed8;
      color: #fff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }
    .bubble, .typing-dot, .pulse-dot {
      will-change: transform, opacity;
    }
    .eye {
      transform-origin: center;
      animation: blink 4s infinite;
    }
    @keyframes blink {
      0%, 95% { opacity: 1; }
      96%, 98% { opacity: 0.1; }
      99%, 100% { opacity: 1; }
    }
    .smile {
      transform-origin: center;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .connected-checkmark {
      display: inline-block;
      width: 20px;
      height: 20px;
      margin-right: 8px;
    }
    .connected-checkmark::after {
      content: "";
      display: block;
      width: 8px;
      height: 14px;
      border: solid #00c853;
      border-width: 0 3px 3px 0;
      transform: rotate(45deg);
      animation: checkmark-appear 0.5s ease-in-out;
    }
    @keyframes checkmark-appear {
      0% { opacity: 0; transform: rotate(45deg) scale(0); }
      50% { transform: rotate(45deg) scale(1.2); }
      100% { opacity: 1; transform: rotate(45deg) scale(1); }
    }
    .start-chatting-btn {
      position: fixed;
      bottom: calc(130px + env(safe-area-inset-bottom));
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 24px;
      background: #007bff;
      color: #fff;
      border: none;
      border-radius: 25px;
      font-weight: bold;
      font-size: 16px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      z-index: 10001;
      animation: pulse-glow 2s infinite;
      display: block;
    }
    body.dark-mode .start-chatting-btn {
      background: #007bff;
      box-shadow: 0 4px 15px rgba(0,123,255,0.4);
    }
    @keyframes pulse-glow {
      0% { box-shadow: 0 4px 15px rgba(0,123,255,0.4); transform: translateX(-50%) scale(1); }
      50% { box-shadow: 0 4px 20px rgba(0,123,255,0.7); transform: translateX(-50%) scale(1.05); }
      100% { box-shadow: 0 4px 15px rgba(0,123,255,0.4); transform: translateX(-50%) scale(1); }
    }
    .start-chatting-btn:hover {
      animation: none;
      box-shadow: 0 4px 20px rgba(0,123,255,0.8);
      transform: translateX(-50%) scale(1);
    }
    .button-icon {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .auto-scroll-enabled #messages {
      scroll-behavior: smooth;
    }
    footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .inputWrapper {
      border: none !important;
      box-shadow: none !important;
    }
    textarea::-webkit-scrollbar {
      width: 4px;
    }
    textarea::-webkit-scrollbar-track {
      background: transparent;
    }
    textarea::-webkit-scrollbar-thumb {
      background: #ccc;
      border-radius: 2px;
    }
    body.dark-mode textarea::-webkit-scrollbar-thumb {
      background: #555;
    }
  </style>
</head>
<body>
  <header>
    <div class="left">
      <svg class="logo" width="auto" height="60" viewBox="0 0 420 140" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="TikTalk animated logo">
        <defs>
          <linearGradient id="gBubble" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#00eaff">
              <animate attributeName="stop-color" dur="6s" values="#00eaff;#007bff;#6a00ff;#00eaff" repeatCount="indefinite"/>
            </stop>
            <stop offset="100%" stop-color="#007bff">
              <animate attributeName="stop-color" dur="6s" values="#007bff;#6a00ff;#00eaff;#007bff" repeatCount="indefinite"/>
            </stop>
          </linearGradient>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <g transform="translate(60,70) scale(1.2)">
          <circle cx="0" cy="0" r="45" fill="url(#gBubble)"/>
          <ellipse class="eye left" cx="-12" cy="-9" rx="4.5" ry="7" fill="#fff"/>
          <path class="right" d="M 8 -9 Q 12 -13 16 -9" stroke="#fff" stroke-width="2.5" stroke-linecap="round" fill="none"/>
          <path class="smile" d="M -10 10 Q 0 18 10 10" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>
        </g>
        <text x="120" y="70" font-size="56" font-family="Segoe UI, Arial, sans-serif" font-weight="800" fill="#007bff" dominant-baseline="middle" alignment-baseline="middle">TikTalk</text>
      </svg>
    </div>
    <div class="right">
      <button id="themeToggle" class="icon-btn">🌙</button>
      <button id="toggleModeBtn" class="icon-btn">📹</button>
      <div style="position: relative;">
        <button id="shareBtn" class="share-btn">
          <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
            <path d="M18 8l-8 8-8-8"/>
            <animate attributeName="stroke" values="#007bff;#00eaff;#6a00ff;#007bff" dur="3s" repeatCount="indefinite"/>
            <animate attributeName="transform" values="scale(1);scale(1.1);scale(1)" dur="1.5s" repeatCount="indefinite"/>
          </svg>
        </button>
        <div class="share-animation"></div>
      </div>
      <div class="share-sheet" id="shareSheet">
        <button onclick="shareApp('whatsapp')"><img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp"></button>
        <button onclick="shareApp('instagram')"><img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" alt="Instagram"></button>
        <button onclick="shareApp('facebook')"><img src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png" alt="Facebook"></button>
        <button onclick="shareApp('x')" aria-label="Share on X">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="20" height="20">
            <circle cx="50" cy="50" r="50" fill="#1DA1F2"/>
            <path d="M30,30 L70,70 M70,30 L30,70" stroke="#fff" stroke-width="10" stroke-linecap="round"/>
          </svg>
        </button>
        <button class="link" onclick="shareApp('link')">🔗</button>
      </div>
    </div>
  </header>
  <div class="chat-wrapper">
    <main id="chat" class="chatSection">
      <div id="messages"></div>
      <div id="typingIndicator" style="display:none;">
        <div class="typing-container">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
      <div id="videoSection" style="display: none;">
        <video id="localVideo" autoplay muted></video>
        <video id="remoteVideo" autoplay></video>
        <div id="videoControls" style="display: none;">
          <button id="muteVideoBtn" class="icon-btn">🎥</button>
          <button id="muteAudioBtn" class="icon-btn">🎤</button>
        </div>
      </div>
    </main>
  </div>
  <button id="startChattingBtn" class="start-chatting-btn">Start Chat</button>
  <p class="footerNote">Made in India <span class="heart">♥️</span></p>
  <footer>
    <button id="emojiToggle" aria-label="Toggle emoji picker" aria-expanded="false">😊</button>
    <div class="inputWrapper">
      <textarea id="messageInput" placeholder="Type a message..."></textarea>
    </div>
    <div class="footer-buttons">
      <button id="sendBtn" title="Send">
        <svg class="button-icon" viewBox="0 0 24 24" fill="white">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </div>
  </footer>
  <button id="nextBtn" title="Next">
    <svg class="button-icon" viewBox="0 0 24 24" fill="white" style="width: 24px; height: 24px; display: block; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); overflow: visible; shape-rendering: geometricPrecision;">
      <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
    </svg>
  </button>
  <div id="emojiPicker" aria-hidden="true"></div>
  <script src="https://cdn.jsdelivr.net/npm/emoji-mart@latest/dist/browser.js"></script>
  <script>
    function debounce(func, wait) {
      let timeout;
      return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    }

    document.addEventListener("DOMContentLoaded", () => {
      const shareBtn = document.getElementById("shareBtn");
      if (shareBtn) {
        shareBtn.style.display = "flex";
        shareBtn.style.visibility = "visible";
        shareBtn.style.opacity = "1";
      } else {
        console.error("Share Button not found in DOM!");
      }
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        themeToggle.textContent = "☀️";
      }
      if ('virtualKeyboard' in navigator) {
        navigator.virtualKeyboard.overlaysContent = true;
        navigator.virtualKeyboard.addEventListener('geometrychange', debouncedAdjustLayout);
      }
      function initializeEmojiPicker() {
        const emojiPicker = document.getElementById("emojiPicker");
        const input = document.getElementById("messageInput");
        if (window.EmojiMart) {
          const picker = new EmojiMart.Picker({
            onEmojiSelect: (e) => {
              if (!emojiPicker.classList.contains('show') || document.activeElement !== input) {
                return;
              }
              input.value += e.native;
              input.focus();
              debouncedAdjustLayout();
            },
            theme: document.body.classList.contains("dark-mode") ? "dark" : "light",
            previewPosition: "none",
            skinTonePosition: "search",
            categories: ["frequent", "people", "nature", "foods", "activity", "places", "objects", "symbols", "flags"],
            emoji: "😊"
          });
          emojiPicker.appendChild(picker);
          window._emojiPickerInstance = picker;
        }
      }
      initializeEmojiPicker();
      const emojiToggle = document.getElementById("emojiToggle");
      const emojiPicker = document.getElementById("emojiPicker");
      const input = document.getElementById("messageInput");
      let wasPickerOpenBeforeKeyboard = false;
      const handleEmojiToggle = (e) => {
        if (e.target !== emojiToggle || e.currentTarget !== emojiToggle) {
          return;
        }
        e.preventDefault();
        e.stopImmediatePropagation();
        const isPickerOpen = emojiPicker.classList.contains('show');
        if (isPickerOpen) {
          emojiPicker.classList.remove('show');
          emojiPicker.style.display = 'none';
          emojiToggle.textContent = "😊";
          emojiToggle.setAttribute('aria-expanded', 'false');
          wasPickerOpenBeforeKeyboard = false;
          input.focus();
        } else {
          emojiPicker.classList.add('show');
          emojiPicker.style.display = 'block';
          emojiToggle.textContent = "⌨️";
          emojiToggle.setAttribute('aria-expanded', 'true');
          input.blur();
        }
        debouncedAdjustLayout();
      };
      emojiToggle.removeEventListener("click", handleEmojiToggle);
      emojiToggle.removeEventListener("touchstart", handleEmojiToggle);
      emojiToggle.removeEventListener("pointerdown", handleEmojiToggle);
      emojiToggle.addEventListener("click", handleEmojiToggle, { passive: false });
      emojiToggle.addEventListener("touchstart", handleEmojiToggle, { passive: false });
      const handleInputInteraction = (e) => {
        e.stopImmediatePropagation();
      };
      input.removeEventListener("click", handleInputInteraction);
      input.removeEventListener("touchstart", handleInputInteraction);
      input.addEventListener("click", handleInputInteraction, { passive: true });
      input.addEventListener("touchstart", handleInputInteraction, { passive: true });
      input.addEventListener("focus", () => {
        if (emojiPicker.classList.contains('show')) {
          emojiPicker.classList.remove('show');
          emojiPicker.style.display = 'none';
          emojiToggle.textContent = "😊";
          emojiToggle.setAttribute('aria-expanded', 'false');
          wasPickerOpenBeforeKeyboard = true;
        }
        adjustLayoutForKeyboard();
        if (!rafId) rafId = requestAnimationFrame(updateLayout);
      });
      input.addEventListener("blur", () => {
        setTimeout(() => {
          const isStillFocused = document.activeElement === input || document.activeElement === emojiToggle;
          if (!isStillFocused) {
            adjustLayoutForKeyboard();
          }
        }, 50);
        if (wasPickerOpenBeforeKeyboard) {
          emojiPicker.classList.add('show');
          emojiPicker.style.display = 'block';
          emojiToggle.textContent = "⌨️";
          emojiToggle.setAttribute('aria-expanded', 'true');
        }
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      });
      input.addEventListener("input", debouncedAdjustLayout);
    });

    const themeToggle = document.getElementById("themeToggle");
    const handleThemeToggle = (e) => {
      e.preventDefault();
      document.body.classList.toggle("dark-mode");
      themeToggle.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
      if (window._emojiPickerInstance) {
        window._emojiPickerInstance.setOptions({
          theme: document.body.classList.contains("dark-mode") ? "dark" : "light"
        });
      }
      localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
    };
    themeToggle.addEventListener("click", handleThemeToggle);
    themeToggle.addEventListener("touchstart", handleThemeToggle, { passive: false });

    const shareBtn = document.getElementById("shareBtn");
    const shareSheet = document.getElementById("shareSheet");
    const startChattingBtn = document.getElementById("startChattingBtn");
    const nextBtn = document.getElementById("nextBtn");
    const toggleModeBtn = document.getElementById("toggleModeBtn");
    let isVideoMode = false;
    let localStream;
    let peerConnection;
    const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

    const handleShareBtn = (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      const btnRect = shareBtn.getBoundingClientRect();
      shareSheet.style.top = (btnRect.bottom + window.scrollY) + "px";
      shareSheet.style.right = (window.innerWidth - btnRect.right) + "px";
      shareSheet.classList.toggle('show');
      if (shareSheet.classList.contains('show')) shareSheet.style.display = 'flex';
      else setTimeout(() => { shareSheet.style.display = 'none'; }, 300);
    };
    shareBtn.addEventListener("click", handleShareBtn);
    shareBtn.addEventListener("touchstart", handleShareBtn, { passive: false });

    document.addEventListener("click", (e) => {
      if (!shareSheet.contains(e.target) && e.target !== shareBtn && shareSheet.classList.contains('show')) {
        shareSheet.classList.remove('show');
        setTimeout(() => { shareSheet.style.display = 'none'; }, 300);
      }
    });
    document.addEventListener("touchstart", (e) => {
      if (!shareSheet.contains(e.target) && e.target !== shareBtn && shareSheet.classList.contains('show')) {
        shareSheet.classList.remove('show');
        setTimeout(() => { shareSheet.style.display = 'none'; }, 300);
      }
    });

    toggleModeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      isVideoMode = !isVideoMode;
      toggleModeBtn.textContent = isVideoMode ? "💬" : "📹";
      document.getElementById("chatSection").style.display = isVideoMode ? "none" : "block";
      document.getElementById("videoSection").style.display = isVideoMode ? "block" : "none";
      if (isVideoMode) {
        showPopup("Welcome to TikTalk Video Chat", false);
        startVideoMode();
      } else {
        stopVideoMode();
        setInitialState();
      }
      startChattingBtn.style.display = 'block'; // मोड चेंज पर स्टार्ट बटन दिखाएं
      nextBtn.style.display = 'none';
    });

    let hasStartedChat = false;
    const handleStartChatting = (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (ws) ws.close();
      hasStartedChat = true;
      startChattingBtn.style.display = 'none';
      nextBtn.style.display = 'block';
      connectStranger();
    };
    startChattingBtn.addEventListener("click", handleStartChatting);
    startChattingBtn.addEventListener("touchstart", handleStartChatting, { passive: false });

    function shareApp(platform) {
      let url = window.location.href;
      if (platform === "whatsapp") window.open("https://wa.me/?text=" + encodeURIComponent(url), "_blank");
      else if (platform === "instagram") window.open("https://www.instagram.com/", "_blank");
      else if (platform === "facebook") window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url), "_blank");
      else if (platform === "x") window.open("https://twitter.com/intent/tweet?url=" + encodeURIComponent(url), "_blank");
      else if (platform === "link") {
        const tempInput = document.createElement('input');
        tempInput.value = url;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        showCopyPopup("✅ Copied!");
      }
    }

    function showCopyPopup(message) {
      let existing = document.getElementById("copyLinkPopup");
      if (existing) existing.remove();
      const popup = document.createElement("div");
      popup.id = "copyLinkPopup";
      popup.textContent = message;
      document.body.appendChild(popup);
      const shareBtnRect = shareBtn.getBoundingClientRect();
      const sheetRect = shareSheet.getBoundingClientRect();
      popup.style.top = (sheetRect.bottom + window.scrollY + 10) + "px";
      popup.style.right = (window.innerWidth - sheetRect.right) + "px";
      popup.style.transform = 'translateY(-10px)';
      void popup.offsetWidth;
      popup.classList.add('show');
      setTimeout(() => {
        popup.classList.remove('show');
      }, 2000);
    }

    function scrollToBottom() {
      const chatDiv = document.getElementById("chat");
      const isNearBottom = chatDiv.scrollHeight - chatDiv.scrollTop - chatDiv.clientHeight < 100;
      if (isNearBottom && messagesDiv.children.length > 0) {
        chatDiv.scrollTop = chatDiv.scrollHeight;
      }
    }

    function showPopup(text, isSearch = false) {
      messagesDiv.innerHTML = '';
      const fragment = document.createDocumentFragment();
      const div = document.createElement("div");
      div.className = "popup";
      if (isSearch) {
        div.innerHTML = `
          <div class="searching-container">
            <div class="pulse-dots">
              <div class="pulse-dot"></div>
              <div class="pulse-dot"></div>
              <div class="pulse-dot"></div>
            </div>
            <span class="searching-text">${text}</span>
          </div>`;
      } else {
        div.textContent = text;
        setTimeout(() => {
          if (messagesDiv.contains(div)) {
            messagesDiv.removeChild(div);
          }
        }, 3000);
      }
      fragment.appendChild(div);
      messagesDiv.appendChild(fragment);
      scrollToBottom();
      updateInputState();
    }

    window.TIKTALK_BACKEND = "https://tiktalkchat-backend-v2.onrender.com";
    const messagesDiv = document.getElementById("messages");
    const input = document.getElementById("messageInput");
    const sendBtn = document.getElementById("sendBtn");
    const typingIndicator = document.getElementById("typingIndicator");
    const footer = document.querySelector("footer");
    const emojiPicker = document.getElementById("emojiPicker");
    let ws, typingTimeout;
    let isConnected = false;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    let lastKeyboardHeight = parseInt(localStorage.getItem('lastKeyboardHeight')) || 350;

    function adjustLayoutForKeyboard() {
      const header = document.querySelector("header");
      const chatDiv = document.getElementById("chat");
      const footerNote = document.querySelector(".footerNote");
      const footer = document.querySelector("footer");
      const startChattingBtn = document.getElementById("startChattingBtn");
      const nextBtn = document.getElementById("nextBtn");
      const emojiPicker = document.getElementById("emojiPicker");
      const headerHeight = header.offsetHeight || 70;
      let safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)') || '0', 10);
      let safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)') || '0', 10);
      const isKeyboardOpen = document.activeElement === document.getElementById("messageInput");
      const isEmojiPickerOpen = emojiPicker.classList.contains('show');
      const isDesktop = window.matchMedia("(min-width: 768px)").matches;
      let keyboardHeight = 0;
      if ('virtualKeyboard' in navigator) {
        keyboardHeight = navigator.virtualKeyboard.boundingRect.height;
      } else if (window.visualViewport) {
        const visualViewportBottom = window.visualViewport.height + window.visualViewport.offsetTop;
        const windowBottom = window.innerHeight;
        keyboardHeight = Math.max(0, windowBottom - visualViewportBottom);
      }
      if (keyboardHeight > 0) {
        lastKeyboardHeight = Math.max(keyboardHeight, 300);
        localStorage.setItem('lastKeyboardHeight', lastKeyboardHeight);
      } else if (!isKeyboardOpen && !isEmojiPickerOpen) {
        lastKeyboardHeight = parseInt(localStorage.getItem('lastKeyboardHeight')) || 350;
      }
      document.documentElement.style.setProperty('--keyboard-height', `${lastKeyboardHeight}px`);
      document.documentElement.style.setProperty('--emoji-picker-height', `${lastKeyboardHeight}px`);
      const emojiPickerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--emoji-picker-height')) || 350;
      if (isKeyboardOpen) {
        footer.style.transition = 'bottom 0.3s ease';
        footer.style.bottom = `calc(${keyboardHeight}px + ${safeAreaBottom}px + 10px)`;
        chatDiv.style.paddingBottom = `calc(${footer.offsetHeight}px + ${keyboardHeight}px + ${safeAreaBottom}px + 10px)`;
        footerNote.style.bottom = `calc(${footer.offsetHeight}px + ${keyboardHeight}px + ${safeAreaBottom}px + 10px)`;
        startChattingBtn.style.bottom = `calc(${footer.offsetHeight}px + ${keyboardHeight}px + ${safeAreaBottom}px + 60px)`;
        nextBtn.style.bottom = `calc(${footer.offsetHeight}px + ${keyboardHeight}px + ${safeAreaBottom}px + 30px)`;
        if (emojiPicker.classList.contains('show')) {
          emojiPicker.classList.remove('show');
          emojiPicker.style.display = 'none';
          document.getElementById("emojiToggle").textContent = "😊";
          document.getElementById("emojiToggle").setAttribute('aria-expanded', 'false');
        }
      } else if (isEmojiPickerOpen) {
        footer.style.transition = 'bottom 0.3s ease';
        footer.style.bottom = `calc(${emojiPickerHeight}px + ${safeAreaBottom}px + 10px)`;
        chatDiv.style.paddingBottom = `calc(${footer.offsetHeight}px + ${emojiPickerHeight}px + ${safeAreaBottom}px + 10px)`;
        footerNote.style.bottom = `calc(${footer.offsetHeight}px + ${emojiPickerHeight}px + ${safeAreaBottom}px + 10px)`;
        startChattingBtn.style.bottom = `calc(${footer.offsetHeight}px + ${emojiPickerHeight}px + ${safeAreaBottom}px + 60px)`;
        nextBtn.style.bottom = `calc(${footer.offsetHeight}px + ${emojiPickerHeight}px + ${safeAreaBottom}px + 30px)`;
        emojiPicker.style.bottom = isDesktop ? `calc(56px + 10px + ${safeAreaBottom}px)` : `calc(10px + ${safeAreaBottom}px)`;
      } else {
        footer.style.transition = 'none';
        footer.style.bottom = `calc(10px + ${safeAreaBottom}px)`;
        chatDiv.style.paddingBottom = `calc(${footer.offsetHeight}px + ${safeAreaBottom}px + 10px)`;
        footerNote.style.bottom = `calc(${footer.offsetHeight}px + ${safeAreaBottom}px + 10px)`;
        startChattingBtn.style.bottom = `calc(${footer.offsetHeight}px + 60px + ${safeAreaBottom}px)`;
        nextBtn.style.bottom = `calc(${footer.offsetHeight}px + 30px + ${safeAreaBottom}px)`;
        emojiPicker.style.bottom = isDesktop ? `calc(56px + 10px + ${safeAreaBottom}px)` : `calc(10px + ${safeAreaBottom}px)`;
        footer.offsetHeight;
        setTimeout(() => {
          footer.style.transition = 'bottom 0.3s ease';
        }, 0);
      }
      footer.style.position = 'fixed';
      footer.style.transform = 'none';
      footer.style.height = isDesktop ? "56px" : "56px";
      chatDiv.style.marginTop = `calc(${headerHeight}px + ${safeAreaTop}px)`;
      chatDiv.style.height = `calc(100vh - ${headerHeight}px - ${safeAreaBottom}px)`;
      requestAnimationFrame(() => {
        footer.offsetHeight;
        scrollToBottom();
      });
    }

    const debouncedAdjustLayout = debounce(adjustLayoutForKeyboard, 50);
    let rafId;
    function updateLayout() {
      adjustLayoutForKeyboard();
      rafId = requestAnimationFrame(updateLayout);
    }
    if (window.visualViewport && !('virtualKeyboard' in navigator)) {
      window.visualViewport.addEventListener("resize", () => {
        const visualViewportBottom = window.visualViewport.height + window.visualViewport.offsetTop;
        const windowBottom = window.innerHeight;
        const keyboardHeight = windowBottom - visualViewportBottom;
        if (keyboardHeight === 0 && document.activeElement !== document.getElementById("messageInput")) {
          adjustLayoutForKeyboard();
        } else {
          debouncedAdjustLayout();
        }
      });
      window.visualViewport.addEventListener("scroll", debouncedAdjustLayout);
    }
    setInterval(() => {
      const isKeyboardOpen = document.activeElement === document.getElementById("messageInput");
      const isEmojiPickerOpen = document.getElementById("emojiPicker").classList.contains('show');
      let keyboardHeight = 0;
      if ('virtualKeyboard' in navigator) {
        keyboardHeight = navigator.virtualKeyboard.boundingRect.height;
      } else if (window.visualViewport) {
        const visualViewportBottom = window.visualViewport.height + window.visualViewport.offsetTop;
        const windowBottom = window.innerHeight;
        keyboardHeight = Math.max(0, windowBottom - visualViewportBottom);
      }
      if (!isKeyboardOpen && keyboardHeight === 0 && !isEmojiPickerOpen) {
        adjustLayoutForKeyboard();
      }
    }, 500);
    window.addEventListener("resize", debouncedAdjustLayout);
    window.addEventListener("touchstart", debouncedAdjustLayout);
    window.addEventListener("touchmove", debouncedAdjustLayout);
    window.addEventListener("load", debouncedAdjustLayout);

    function addMessage(text, who) {
      const fragment = document.createDocumentFragment();
      const div = document.createElement("div");
      div.className = "msg " + who;
      div.textContent = text;
      fragment.appendChild(div);
      messagesDiv.appendChild(fragment);
      scrollToBottom();
      startChattingBtn.style.display = 'none';
      nextBtn.style.display = 'block';
      debouncedAdjustLayout();
    }

    function updateInputState() {
      input.disabled = !isConnected;
      sendBtn.disabled = !isConnected;
    }

    function startVideoMode() {
      document.getElementById("videoControls").style.display = "flex";
      document.getElementById("videoSection").style.display = "block"; // सुनिश्चित करें कि वीडियो सेक्शन दिखे
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          localStream = stream;
          const localVideo = document.getElementById("localVideo");
          localVideo.srcObject = stream;
          console.log("Local stream set:", stream);
          connectStranger();
        })
        .catch((err) => {
          console.error("Error accessing media:", err);
          showPopup("❌ Camera/Mic access denied", false);
          toggleModeBtn.click();
        });
    }

    function stopVideoMode() {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        localStream = null;
      }
      if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
      }
      document.getElementById("videoControls").style.display = "none";
      document.getElementById("localVideo").srcObject = null;
      document.getElementById("remoteVideo").srcObject = null;
      document.getElementById("videoSection").style.display = "none";
    }

    function startWebRTC() {
      peerConnection = new RTCPeerConnection(config);
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
        console.log("Added track:", track);
      });
      peerConnection.ontrack = (event) => {
        const remoteVideo = document.getElementById("remoteVideo");
        remoteVideo.srcObject = event.streams[0];
        console.log("Remote stream received:", event.streams[0]);
      };
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          ws.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate }));
          console.log("Sent ICE candidate:", event.candidate);
        }
      };
      peerConnection.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", peerConnection.iceConnectionState);
        if (peerConnection.iceConnectionState === "disconnected" || peerConnection.iceConnectionState === "failed") {
          showPopup("❌ Video call disconnected", false);
          stopVideoMode();
          connectStranger();
        }
      };
      peerConnection.createOffer().then((offer) => {
        peerConnection.setLocalDescription(offer);
        ws.send(JSON.stringify({ type: "offer", offer }));
        console.log("Sent offer:", offer);
      }).catch((err) => {
        console.error("Error creating offer:", err);
      });
    }

    function handleOffer(offer) {
      peerConnection.setRemoteDescription(new RTCSessionDescription(offer)).then(() => {
        peerConnection.createAnswer().then((answer) => {
          peerConnection.setLocalDescription(answer);
          ws.send(JSON.stringify({ type: "answer", answer }));
          console.log("Sent answer:", answer);
        }).catch((err) => {
          console.error("Error creating answer:", err);
        });
      }).catch((err) => {
        console.error("Error setting remote description:", err);
      });
    }

    function handleAnswer(answer) {
      peerConnection.setRemoteDescription(new RTCSessionDescription(answer)).catch((err) => {
        console.error("Error setting answer:", err);
      });
    }

    function handleIceCandidate(candidate) {
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch((err) => {
        console.error("Error adding ICE candidate:", err);
      });
    }

    document.getElementById("muteVideoBtn").addEventListener("click", () => {
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        videoTrack.enabled = !videoTrack.enabled;
        document.getElementById("muteVideoBtn").textContent = videoTrack.enabled ? "🎥" : "📷";
      }
    });

    document.getElementById("muteAudioBtn").addEventListener("click", () => {
      if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        audioTrack.enabled = !audioTrack.enabled;
        document.getElementById("muteAudioBtn").textContent = audioTrack.enabled ? "🎤" : "🔇";
      }
    });

    function connectStranger() {
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
      messagesDiv.innerHTML = '';
      showPopup(isVideoMode ? "🔍 Searching for a video chat..." : "🔍 Searching for a stranger...", true);
      typingIndicator.style.display = "none";
      nextBtn.style.display = 'block';
      ws = new WebSocket(window.TIKTALK_BACKEND.replace("http", "ws"));

      ws.onopen = () => {
        reconnectAttempts = 0;
        ws.send(JSON.stringify({ type: "mode", mode: isVideoMode ? "video" : "chat" }));
        updateInputState();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case "system":
              if (data.text === "waiting" && !isConnected) {
                showPopup(isVideoMode ? "🔍 Searching for a video chat..." : "🔍 Searching for a stranger...", true);
              } else if (data.text === "connected") {
                isConnected = true;
                showPopup(isVideoMode ? "✅ Connected! Video call started 📹" : "✅ Connected! Say Hi 👋", false);
                if (isVideoMode) {
                  startWebRTC();
                } else {
                  input.focus(); // चैट मोड में कीबोर्ड खोलें
                }
              } else if (data.text === "disconnected") {
                if (isConnected) {
                  showPopup(isVideoMode ? "❌ Video call disconnected" : "❌ Stranger disconnected", false);
                  if (isVideoMode) stopVideoMode();
                }
                isConnected = false;
                setInitialState();
              } else if (data.text === "timeout") {
                showPopup("No one was found. Click Next Button", false);
                isConnected = false;
                setInitialState();
              }
              break;
            case "message":
              typingIndicator.style.display = "none";
              addMessage(data.text, "stranger");
              break;
            case "typing":
              if (isConnected) {
                typingIndicator.style.display = "block";
                clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => {
                  typingIndicator.style.display = "none";
                }, 1500);
              }
              break;
            case "offer":
              if (isVideoMode) handleOffer(data.offer);
              break;
            case "answer":
              if (isVideoMode) handleAnswer(data.answer);
              break;
            case "ice-candidate":
              if (isVideoMode) handleIceCandidate(data.candidate);
              break;
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      };

      ws.onclose = () => {
        if (isConnected) {
          showPopup(isVideoMode ? "❌ Video call disconnected" : "❌ Stranger disconnected", false);
          if (isVideoMode) stopVideoMode();
        }
        typingIndicator.style.display = "none";
        isConnected = false;
        setInitialState();
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    const handleSend = (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (isConnected && input.value.trim()) {
        ws.send(JSON.stringify({ type: "message", text: input.value }));
        addMessage(input.value, "me");
        input.value = "";
        emojiPicker.classList.remove('show');
        emojiPicker.style.display = 'none';
        document.getElementById("emojiToggle").textContent = "😊";
        document.getElementById("emojiToggle").setAttribute('aria-expanded', 'false');
        wasPickerOpenBeforeKeyboard = false;
        debouncedAdjustLayout();
      }
    };
    sendBtn.addEventListener("click", handleSend);
    sendBtn.addEventListener("touchstart", handleSend, { passive: false });

    const handleNext = (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (isVideoMode) stopVideoMode();
      connectStranger();
      debouncedAdjustLayout();
    };
    nextBtn.addEventListener("click", handleNext);
    nextBtn.addEventListener("touchstart", handleNext, { passive: false });

    input.addEventListener("input", () => {
      if (isConnected && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "typing" }));
      }
    });

    document.body.classList.add('auto-scroll-enabled');
    const observer = new MutationObserver(() => {
      scrollToBottom();
    });
    observer.observe(messagesDiv, { childList: true, subtree: true });

    function setInitialState() {
      startChattingBtn.style.display = 'block';
      nextBtn.style.display = 'none';
      messagesDiv.innerHTML = '';
      showPopup(isVideoMode ? "Welcome to TikTalk Video Chat" : "Welcome to TikTalk! Click 'Start Chat' to connect with a stranger.", false);
      updateInputState();
    }
    setInitialState();
  </script>
</body>
</html>