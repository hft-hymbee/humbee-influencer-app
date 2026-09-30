import React, { useState } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import WebView from 'react-native-webview';
import { SkeletonFill } from './Skeleton';

/** The URL lands inside an HTML attribute; a stray quote must not end it. */
function escapeAttr(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

interface RemoteSvgProps {
  uri: string;
  width?: number | string;
  height?: number | string;
  style?: StyleProp<ViewStyle>;
  /** CSS `object-fit`: `contain` letterboxes, `cover` fills the box and crops the overflow. */
  fit?: 'contain' | 'cover';
}

const RemoteSvg: React.FC<RemoteSvgProps> = ({ uri, width = '100%', height = '100%', style, fit = 'contain' }) => {
  /**
   * The skeleton stays until the IMAGE reports, not the WebView: `onLoadEnd` fires once the
   * wrapper HTML is parsed, while the logo itself is still downloading. Error counts as settled
   * too — a broken logo shows an empty tile, not a pulse that never ends.
   */
  const [settled, setSettled] = useState(false);
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: transparent;
            overflow: hidden;
          }
          img, svg {
            width: 100%;
            height: 100%;
            object-fit: ${fit};
          }
        </style>
      </head>
      <body>
        <img src="${escapeAttr(uri)}" onload="window.ReactNativeWebView.postMessage('settled')" onerror="window.ReactNativeWebView.postMessage('settled')" />
      </body>
    </html>
  `;

  return (
    <View style={[{ backgroundColor: 'transparent' }, style, { width, height, overflow: 'hidden' } as ViewStyle]}>
      <WebView
        source={{ html }}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        originWhitelist={['*']}
        // Only for the two inline handlers above; the page is ours and loads nothing else.
        javaScriptEnabled
        onMessage={() => setSettled(true)}
      />
      <SkeletonFill visible={!settled} />
    </View>
  );
};

export default RemoteSvg;
