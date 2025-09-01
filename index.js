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
      const input = document.getElementById