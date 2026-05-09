// Surgically replaces double-encoded emoji strings with correct UTF-8 equivalents.
// Run: node fix-emojis.js <file>
const fs = require('fs');
const path = process.argv[2];
if (!path) { console.error('Usage: node fix-emojis.js <file>'); process.exit(1); }

// Map of corrupted sequence → correct string
// Each entry is: [corrupted_string, correct_string]
const REPLACEMENTS = [
  // Common emojis seen in calculator pages
  ["\u00f0\u009f\u0091\u00a4", "\uD83D\uDC64"], // 👤
  ["\u00f0\u009f\u0092\u00b0", "\uD83D\uDCB0"], // 💰
  ["\u00f0\u009f\u009b\u00a1\u00ef\u00b8\u008f", "\uD83D\uDEE1\uFE0F"], // 🛡️
  ["\u00f0\u009f\u009b\u00a1", "\uD83D\uDEE1"],  // 🛡
  ["\u00e2\u009a\u0099\u00ef\u00b8\u008f", "\u2699\uFE0F"], // ⚙️
  ["\u00f0\u009f\u0093\u008a", "\uD83D\uDCCA"], // 📊
  ["\u00e2\u0099\u0082\u00ef\u00b8\u008f", "\u2642\uFE0F"], // ♂️
  ["\u00e2\u0099\u0080\u00ef\u00b8\u008f", "\u2640\uFE0F"], // ♀️
  ["\u00f0\u009f\u009a\u00ac", "\uD83D\uDEAC"], // 🚬
  ["\u00f0\u009f\u0092\u00a1", "\uD83D\uDCA1"], // 💡
  ["\u00f0\u009f\u008e\u00af", "\uD83C\uDFAF"], // 🎯
  ["\u00f0\u009f\u0094\u009c", "\uD83D\uDD1C"], // 🔜
  ["\u00f0\u009f\u0093\u00b1", "\uD83D\uDCF1"], // 📱
  ["\u00f0\u009f\u008e\u0093", "\uD83C\uDF93"], // 🎓
  ["\u00f0\u009f\u0091\u00b4", "\uD83D\uDC74"], // 👴
  ["\u00f0\u009f\u0093\u0089", "\uD83D\uDCC9"], // 📉
  ["\u00f0\u009f\u0093\u0088", "\uD83D\uDCC8"], // 📈
  ["\u00f0\u009f\u0092\u008d", "\uD83D\uDC8D"], // 💍
  ["\u00f0\u009f\u008f\u00a0", "\uD83C\uDFE0"], // 🏠
  ["\u00f0\u009f\u008f\u00a6", "\uD83C\uDFE6"], // 🏦
  ["\u00f0\u009f\u0092\u00b3", "\uD83D\uDCB3"], // 💳
  ["\u00f0\u009f\u0097\u0093", "\uD83D\uDDD3"], // 🗓
  ["\u00f0\u009f\u0094\u0094", "\uD83D\uDD14"], // 🔔
  ["\u00e2\u009c\u0085", "\u2705"],              // ✅
  ["\u00e2\u009d\u0093", "\u2753"],              // ❓
  ["\u00e2\u009a\u00a0\u00ef\u00b8\u008f", "\u26A0\uFE0F"], // ⚠️
  ["\u00e2\u009a\u00a0", "\u26A0"],              // ⚠
  ["\u00e2\u0084\u00b9\u00ef\u00b8\u008f", "\u2139\uFE0F"], // ℹ️
  ["\u00f0\u009f\u0092\u00ae", "\uD83D\uDCAE"], // 💮
  ["\u00f0\u009f\u0094\u00b4", "\uD83D\uDD34"], // 🔴
  ["\u00e2\u009d\u0094", "\u2754"],              // ❔
  ["\u00f0\u009f\u0093\u00b7", "\uD83D\uDCF7"], // 📷
  ["\u00f0\u009f\u009a\u0080", "\uD83D\uDE80"], // 🚀
  ["\u00f0\u009f\u008e\u0081", "\uD83C\uDF81"], // 🎁
  ["\u00f0\u009f\u008f\u00b5\u00ef\u00b8\u008f", "\uD83C\uDFF5\uFE0F"], // 🏵️
  ["\u00f0\u009f\u008f\u00b5", "\uD83C\uDFF5"], // 🏵
  ["\u00f0\u009f\u0093\u0091", "\uD83D\uDCD1"], // 📑
  ["\u00f0\u009f\u0097\u009e\u00ef\u00b8\u008f", "\uD83D\uDDDE\uFE0F"], // 🗞️
  ["\u00f0\u009f\u0094\u0097", "\uD83D\uDD17"], // 🔗
  ["\u00f0\u009f\u0094\u008c", "\uD83D\uDD0C"], // 🔌
  ["\u00f0\u009f\u009b\u00a1\u00ef\u00b8\u008f", "\uD83D\uDEE1\uFE0F"], // 🛡️
  ["\u00f0\u009f\u00a4\u0096", "\uD83E\uDD16"], // 🤖
  ["\u00f0\u009f\u008e\u009b\u00ef\u00b8\u008f", "\uD83C\uDF9B\uFE0F"], // 🎛️
  ["\u00f0\u009f\u0090\u009b", "\uD83D\uDC1B"], // 🐛  (bug)
  ["\u00e2\u009c\u00a8", "\u2728"],              // ✨
  ["\u00f0\u009f\u0092\u00ab", "\uD83D\uDCAB"], // 💫
];

let content = fs.readFileSync(path, 'utf8');
let count = 0;
for (const [from, to] of REPLACEMENTS) {
  const before = content;
  content = content.split(from).join(to);
  if (content !== before) count++;
}
fs.writeFileSync(path, content, { encoding: 'utf8' });
console.log(`✅ Replaced ${count} emoji sequences in ${path}`);
