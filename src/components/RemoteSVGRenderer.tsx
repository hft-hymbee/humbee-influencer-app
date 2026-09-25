import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import WebView from 'react-native-webview';

interface RemoteSvgProps {
  uri: string;
  width?: number | string;
  height?: number | string;
  style?: StyleProp<ViewStyle>;
  /** CSS `object-fit`: `contain` letterboxes, `cover` fills the box and crops the overflow. */
  fit?: 'contain' | 'cover';
}

const RemoteSvg: React.FC<RemoteSvgProps> = ({ uri, width = '100%', height = '100%', style, fit = 'contain' }) => {
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
        <img src="${uri}" />
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
        javaScriptEnabled={false}
        allowFileAccess
      />
    </View>
  );
};

export default RemoteSvg;
