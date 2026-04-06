import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors } from '../../constants/theme';

interface MathTextProps {
  content: string;
  style?: any;
  fontSize?: number;
  color?: string;
}

/**
 * LaTeX 문자열 정규화 - 깨진 백슬래시 복원
 * Gemini API나 JSON 전달 과정에서 깨진 LaTeX 명령어를 복구
 */
const normalizeLatexString = (str: string): string => {
  if (!str) return str;
  return str
    // 깨진 유니코드 문자 → 백슬래시로 복원
    .replace(/♀/g, '\\')
    .replace(/\\u2640/g, '\\')
    .replace(/\u2640/g, '\\')
    // 잘못된 패턴 복구: ♀rac → \frac, ♀sqrt → \sqrt 등
    .replace(/[♀\u2640]([a-zA-Z]+)/g, '\\$1')
    // 이중 백슬래시 정리 (\\frac → \frac, 단 \\n, \\t 등은 유지)
    .replace(/\\\\([a-zA-Z]+)(?![a-zA-Z])/g, '\\$1');
};

/**
 * LaTeX 수식이 포함된 텍스트를 렌더링하는 컴포넌트
 * $...$로 감싸진 인라인 수식과 $$...$$로 감싸진 블록 수식을 지원
 *
 * 네이티브에서는 WebView + KaTeX, 웹에서는 iframe 사용
 */
export default function MathText({
  content,
  style,
  fontSize = 16,
  color = colors.textPrimary
}: MathTextProps) {
  // 렌더링 전 LaTeX 정규화 적용
  const normalizedContent = normalizeLatexString(content);
  const [height, setHeight] = useState(40);

  // LaTeX가 포함되어 있는지 확인
  // 임시: Android에서 WebView 문제로 인해 항상 텍스트 렌더링
  const hasLatex = Platform.OS === 'web' ? normalizedContent.includes('$') : false;

  // KaTeX HTML 생성
  const html = useMemo(() => {
    if (!hasLatex) return '';

    // normalizedContent를 HTML로 변환 ($ 수식 처리)
    let processedContent = normalizedContent
      .replace(/\$\$([\s\S]*?)\$\$/g, '<span class="block-math">\\[$1\\]</span>')
      .replace(/\$((?!\$)[\s\S]*?)\$/g, '<span class="inline-math">\\($1\\)</span>');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: ${fontSize}px;
      line-height: 1.6;
      color: ${color};
      background: transparent;
      padding: 4px 0;
    }
    .content {
      word-wrap: break-word;
    }
    .block-math {
      display: block;
      text-align: center;
      margin: 12px 0;
      padding: 8px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    .katex {
      font-size: 1.1em;
    }
    .katex-display {
      margin: 0;
      overflow-x: auto;
      overflow-y: hidden;
    }
  </style>
</head>
<body>
  <div class="content">${processedContent}</div>
  <script>
    document.addEventListener("DOMContentLoaded", function() {
      renderMathInElement(document.body, {
        delimiters: [
          {left: "\\\\[", right: "\\\\]", display: true},
          {left: "\\\\(", right: "\\\\)", display: false}
        ],
        throwOnError: false
      });

      // 높이 전송 (네이티브용)
      setTimeout(() => {
        const height = document.body.scrollHeight;
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ height }));
        }
      }, 100);
    });
  </script>
</body>
</html>
    `;
  }, [normalizedContent, fontSize, color, hasLatex]);

  // LaTeX가 없으면 일반 텍스트로 렌더링
  if (!hasLatex) {
    return (
      <Text style={[styles.text, { fontSize, color }, style]}>
        {normalizedContent}
      </Text>
    );
  }

  // 웹 플랫폼
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        <iframe
          srcDoc={html}
          style={{
            border: 'none',
            width: '100%',
            minHeight: 40,
            height: 'auto',
            backgroundColor: 'transparent',
          }}
          scrolling="no"
          onLoad={(e: any) => {
            try {
              const iframe = e.target;
              const newHeight = iframe.contentWindow?.document.body.scrollHeight || 40;
              iframe.style.height = `${newHeight + 10}px`;
            } catch (err) {
              // cross-origin 에러 무시
            }
          }}
        />
      </View>
    );
  }

  // 네이티브 플랫폼 (iOS, Android)
  // WebView는 동적으로 import하여 웹 빌드 시 에러 방지
  let WebViewComponent: any = null;
  try {
    WebViewComponent = require('react-native-webview').WebView;
  } catch (e) {
    // WebView 로드 실패 시 텍스트로 폴백
  }

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.height) {
        setHeight(data.height + 10);
      }
    } catch (e) {
      // ignore
    }
  };

  // WebView 사용 불가 시 일반 텍스트로 폴백
  if (!WebViewComponent) {
    return (
      <Text style={[styles.text, { fontSize, color }, style]}>
        {normalizedContent}
      </Text>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <WebViewComponent
        source={{ html: html }}
        style={[styles.webview, { height: height }]}
        scrollEnabled={false}
        onMessage={handleMessage}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        textZoom={100}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 30,
  },
  text: {
    color: colors.textPrimary,
    lineHeight: 24,
  },
  webview: {
    backgroundColor: 'transparent',
    flex: 1,
  },
});
