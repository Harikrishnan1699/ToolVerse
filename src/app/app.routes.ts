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
  { path: 'pdf/protect', loadComponent: () => import('./pages/pdf-protect/pdf-protect').then(m => m.PdfProtect) },

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
  { path: 'dev/html', loadComponent: () => import('./pages/dev-html/dev-html').then(m => m.DevHtml) },

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
  { path: 'typing-test', loadComponent: () => import('./pages/typing-test/typing-test').then(m => m.TypingTest), title: 'Typing Test — Toolverse' },
  { path: 'ai-writer', loadComponent: () => import('./pages/ai-writer/ai-writer').then(m => m.AiWriter), title: 'AI Writing Assistant — Toolverse' },

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

  // PWA handlers
  { path: 'share', loadComponent: () => import('./pages/share-handler/share-handler').then(m => m.ShareHandler), title: 'Receiving share — Toolverse' },
  { path: 'open', loadComponent: () => import('./pages/open-handler/open-handler').then(m => m.OpenHandler), title: 'Opening — Toolverse' },
  { path: 'settings', loadComponent: () => import('./pages/settings/settings').then(m => m.Settings), title: 'Settings — Toolverse' },

  // Hardware / sensor tools
  { path: 'hw/nfc', loadComponent: () => import('./pages/hw-nfc/hw-nfc').then(m => m.HwNfc), title: 'NFC — Toolverse' },
  { path: 'hw/speed', loadComponent: () => import('./pages/hw-speed/hw-speed').then(m => m.HwSpeed), title: 'GPS Speed — Toolverse' },
  { path: 'hw/shake', loadComponent: () => import('./pages/hw-shake/hw-shake').then(m => m.HwShake), title: 'Shake Dice — Toolverse' },
  { path: 'hw/p2p', loadComponent: () => import('./pages/hw-p2p/hw-p2p').then(m => m.HwP2p), title: 'P2P Transfer — Toolverse' },

  // More dev / text
  { path: 'dev/compress-text', loadComponent: () => import('./pages/dev-compress-text/dev-compress-text').then(m => m.DevCompressText), title: 'Gzip / Deflate — Toolverse' },
  { path: 'text/translate', loadComponent: () => import('./pages/text-translate/text-translate').then(m => m.TextTranslate), title: 'Translator — Toolverse' },

  // Daily-use tools
  { path: 'screen-recorder', loadComponent: () => import('./pages/screen-recorder/screen-recorder').then(m => m.ScreenRecorder), title: 'Screen Recorder — Toolverse' },
  { path: 'api-tester', loadComponent: () => import('./pages/api-tester/api-tester').then(m => m.ApiTester), title: 'API Tester — Toolverse' },
  { path: 'invoice-generator', loadComponent: () => import('./pages/invoice-generator/invoice-generator').then(m => m.InvoiceGenerator), title: 'Invoice Generator — Toolverse' },
  { path: 'timezone-converter', loadComponent: () => import('./pages/timezone-converter/timezone-converter').then(m => m.TimezoneConverter), title: 'Time Zone Converter — Toolverse' },
  { path: 'exif-stripper', loadComponent: () => import('./pages/exif-stripper/exif-stripper').then(m => m.ExifStripper), title: 'EXIF Stripper — Toolverse' },
  { path: 'dev/data-convert', loadComponent: () => import('./pages/dev-data-convert/dev-data-convert').then(m => m.DevDataConvert), title: 'Data Converter — Toolverse' },
  { path: 'dev/sql', loadComponent: () => import('./pages/dev-sql/dev-sql').then(m => m.DevSql), title: 'SQL Formatter — Toolverse' },
  { path: 'dev/cron', loadComponent: () => import('./pages/dev-cron/dev-cron').then(m => m.DevCron), title: 'Cron Builder — Toolverse' },
  { path: 'security/totp', loadComponent: () => import('./pages/sec-totp/sec-totp').then(m => m.SecTotp), title: 'TOTP Generator — Toolverse' },
  { path: 'security/url-clean', loadComponent: () => import('./pages/sec-url-clean/sec-url-clean').then(m => m.SecUrlClean), title: 'URL Cleaner — Toolverse' },
  { path: 'security/breach', loadComponent: () => import('./pages/sec-breach/sec-breach').then(m => m.SecBreach), title: 'Password Breach Check — Toolverse' },
  { path: 'calc/tax', loadComponent: () => import('./pages/calc-tax/calc-tax').then(m => m.CalcTax), title: 'Tax & SIP Calculators — Toolverse' },
  { path: 'calc/health', loadComponent: () => import('./pages/calc-health/calc-health').then(m => m.CalcHealth), title: 'Health Calculators — Toolverse' },
  { path: 'email-signature', loadComponent: () => import('./pages/email-signature/email-signature').then(m => m.EmailSignature), title: 'Email Signature — Toolverse' },
  { path: 'markdown-table', loadComponent: () => import('./pages/markdown-table/markdown-table').then(m => m.MarkdownTable), title: 'Markdown Table Builder — Toolverse' },
  { path: 'habit-tracker', loadComponent: () => import('./pages/habit-tracker/habit-tracker').then(m => m.HabitTracker), title: 'Habit Tracker — Toolverse' },
  { path: 'image/palette', loadComponent: () => import('./pages/image-palette/image-palette').then(m => m.ImagePalette), title: 'Color Palette Extractor — Toolverse' },
  { path: 'resume-maker', loadComponent: () => import('./pages/resume-maker/resume-maker').then(m => m.ResumeMaker), title: 'Resume Maker — Toolverse' },

  { path: '**', redirectTo: '' },
];
