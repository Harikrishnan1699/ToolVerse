import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/landing/landing').then(m => m.Landing), title: 'Toolverse — All-in-one toolkit' },

  // PDF
  { path: 'pdf', loadComponent: () => import('./pages/pdf-hub/pdf-hub').then(m => m.PdfHub), title: 'PDF Tools' },
  { path: 'pdf/merge', loadComponent: () => import('./pages/pdf-merge/pdf-merge').then(m => m.PdfMerge) },
  { path: 'pdf/split', loadComponent: () => import('./pages/pdf-split/pdf-split').then(m => m.PdfSplit) },
  { path: 'pdf/remove-pages', loadComponent: () => import('./pages/pdf-remove-pages/pdf-remove-pages').then(m => m.PdfRemovePages) },
  { path: 'pdf/extract-pages', loadComponent: () => import('./pages/pdf-extract-pages/pdf-extract-pages').then(m => m.PdfExtractPages) },
  { path: 'pdf/organize', loadComponent: () => import('./pages/pdf-organize/pdf-organize').then(m => m.PdfOrganize) },
  { path: 'pdf/scan', loadComponent: () => import('./pages/pdf-scan/pdf-scan').then(m => m.PdfScan) },
  { path: 'pdf/compress', loadComponent: () => import('./pages/pdf-compress/pdf-compress').then(m => m.PdfCompress) },
  { path: 'pdf/repair', loadComponent: () => import('./pages/pdf-repair/pdf-repair').then(m => m.PdfRepair) },
  { path: 'pdf/images-to-pdf', loadComponent: () => import('./pages/pdf-images/pdf-images').then(m => m.PdfImages) },
  { path: 'pdf/html-to-pdf', loadComponent: () => import('./pages/pdf-html/pdf-html').then(m => m.PdfHtml) },
  { path: 'pdf/pdf-to-jpg', loadComponent: () => import('./pages/pdf-to-jpg/pdf-to-jpg').then(m => m.PdfToJpg) },
  { path: 'pdf/rotate', loadComponent: () => import('./pages/pdf-rotate/pdf-rotate').then(m => m.PdfRotate) },
  { path: 'pdf/page-numbers', loadComponent: () => import('./pages/pdf-page-numbers/pdf-page-numbers').then(m => m.PdfPageNumbers) },
  { path: 'pdf/watermark', loadComponent: () => import('./pages/pdf-watermark/pdf-watermark').then(m => m.PdfWatermark) },
  { path: 'pdf/crop', loadComponent: () => import('./pages/pdf-crop/pdf-crop').then(m => m.PdfCrop) },
  { path: 'pdf/edit', loadComponent: () => import('./pages/pdf-edit/pdf-edit').then(m => m.PdfEdit) },
  { path: 'pdf/unlock', loadComponent: () => import('./pages/pdf-unlock/pdf-unlock').then(m => m.PdfUnlock) },
  { path: 'pdf/sign', loadComponent: () => import('./pages/pdf-sign/pdf-sign').then(m => m.PdfSign) },
  { path: 'pdf/redact', loadComponent: () => import('./pages/pdf-redact/pdf-redact').then(m => m.PdfRedact) },

  // Image
  { path: 'image', loadComponent: () => import('./pages/image-hub/image-hub').then(m => m.ImageHub), title: 'Image Tools' },
  { path: 'image/compress', loadComponent: () => import('./pages/image-compress/image-compress').then(m => m.ImageCompress) },
  { path: 'image/resize', loadComponent: () => import('./pages/image-resize/image-resize').then(m => m.ImageResize) },
  { path: 'image/convert', loadComponent: () => import('./pages/image-convert/image-convert').then(m => m.ImageConvert) },
  { path: 'image/watermark', loadComponent: () => import('./pages/image-watermark/image-watermark').then(m => m.ImageWatermark) },
  { path: 'image/favicon', loadComponent: () => import('./pages/image-favicon/image-favicon').then(m => m.ImageFavicon) },
  { path: 'image/color-picker', loadComponent: () => import('./pages/image-color-picker/image-color-picker').then(m => m.ImageColorPicker) },
  { path: 'image/meme', loadComponent: () => import('./pages/image-meme/image-meme').then(m => m.ImageMeme) },
  { path: 'image/ocr', loadComponent: () => import('./pages/image-ocr/image-ocr').then(m => m.ImageOcr) },
  { path: 'image/background-remove', loadComponent: () => import('./pages/image-bg-remove/image-bg-remove').then(m => m.ImageBgRemove) },

  // Media
  { path: 'media', loadComponent: () => import('./pages/media-hub/media-hub').then(m => m.MediaHub), title: 'Media Tools' },
  { path: 'media/video-to-gif', loadComponent: () => import('./pages/media-video-gif/media-video-gif').then(m => m.MediaVideoGif) },
  { path: 'media/video-compress', loadComponent: () => import('./pages/media-video-compress/media-video-compress').then(m => m.MediaVideoCompress) },
  { path: 'media/video-trim', loadComponent: () => import('./pages/media-video-trim/media-video-trim').then(m => m.MediaVideoTrim) },
  { path: 'media/audio-convert', loadComponent: () => import('./pages/media-audio-convert/media-audio-convert').then(m => m.MediaAudioConvert) },
  { path: 'media/audio-trim', loadComponent: () => import('./pages/media-audio-trim/media-audio-trim').then(m => m.MediaAudioTrim) },

  // Dev
  { path: 'dev', loadComponent: () => import('./pages/dev-hub/dev-hub').then(m => m.DevHub), title: 'Developer Tools' },
  { path: 'dev/json', loadComponent: () => import('./pages/dev-json/dev-json').then(m => m.DevJson) },
  { path: 'dev/base64', loadComponent: () => import('./pages/dev-base64/dev-base64').then(m => m.DevBase64) },
  { path: 'dev/url', loadComponent: () => import('./pages/dev-url/dev-url').then(m => m.DevUrl) },
  { path: 'dev/hash', loadComponent: () => import('./pages/dev-hash/dev-hash').then(m => m.DevHash) },
  { path: 'dev/jwt', loadComponent: () => import('./pages/dev-jwt/dev-jwt').then(m => m.DevJwt) },
  { path: 'dev/uuid', loadComponent: () => import('./pages/dev-uuid/dev-uuid').then(m => m.DevUuid) },
  { path: 'dev/regex', loadComponent: () => import('./pages/dev-regex/dev-regex').then(m => m.DevRegex) },
  { path: 'dev/color', loadComponent: () => import('./pages/dev-color/dev-color').then(m => m.DevColor) },
  { path: 'dev/gradient', loadComponent: () => import('./pages/dev-gradient/dev-gradient').then(m => m.DevGradient) },
  { path: 'dev/box-shadow', loadComponent: () => import('./pages/dev-shadow/dev-shadow').then(m => m.DevShadow) },

  // Text
  { path: 'text', loadComponent: () => import('./pages/text-tools/text-tools').then(m => m.TextTools), title: 'Text Tools' },
  { path: 'text/markdown', loadComponent: () => import('./pages/text-markdown/text-markdown').then(m => m.TextMarkdown) },
  { path: 'text/speech', loadComponent: () => import('./pages/text-speech/text-speech').then(m => m.TextSpeech) },

  // Calculators
  { path: 'calc', loadComponent: () => import('./pages/calc-tools/calc-tools').then(m => m.CalcTools), title: 'Calculators' },

  // QR
  { path: 'qr/generator', loadComponent: () => import('./pages/qr-generator/qr-generator').then(m => m.QrGenerator), title: 'QR Generator' },
  { path: 'qr/scanner', loadComponent: () => import('./pages/qr-scanner/qr-scanner').then(m => m.QrScanner), title: 'QR Scanner' },

  // Security
  { path: 'security/password', loadComponent: () => import('./pages/sec-password/sec-password').then(m => m.SecPassword), title: 'Password Tools' },
  { path: 'security/aes', loadComponent: () => import('./pages/sec-aes/sec-aes').then(m => m.SecAes), title: 'AES Encrypt' },
  { path: 'security/faker', loadComponent: () => import('./pages/sec-faker/sec-faker').then(m => m.SecFaker), title: 'Fake Data' },

  // Productivity
  { path: 'productivity', loadComponent: () => import('./pages/productivity-hub/productivity-hub').then(m => m.ProductivityHub), title: 'Productivity' },

  // SEO
  { path: 'seo/meta', loadComponent: () => import('./pages/seo-meta/seo-meta').then(m => m.SeoMeta), title: 'Meta Generator' },
  { path: 'seo/robots', loadComponent: () => import('./pages/seo-robots/seo-robots').then(m => m.SeoRobots), title: 'Robots & Sitemap' },

  // Live data
  { path: 'currency', loadComponent: () => import('./pages/currency/currency').then(m => m.Currency) },
  { path: 'crypto', loadComponent: () => import('./pages/crypto/crypto').then(m => m.Crypto) },
  { path: 'weather', loadComponent: () => import('./pages/weather/weather').then(m => m.Weather) },
  { path: 'country', loadComponent: () => import('./pages/country-info/country-info').then(m => m.CountryInfo), title: 'Country Info' },
  { path: 'ip', loadComponent: () => import('./pages/ip-lookup/ip-lookup').then(m => m.IpLookup), title: 'IP Lookup' },
  { path: 'holidays', loadComponent: () => import('./pages/holidays/holidays').then(m => m.Holidays), title: 'Holidays' },

  { path: '**', redirectTo: '' },
];
