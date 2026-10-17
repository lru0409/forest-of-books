// Prisma 7 client가 로드하는 ESM(.mjs) wasm 런타임을 jest(CommonJS)에서 쓸 수 있게 변환한다.
const crypto = require('crypto');
const fs = require('fs');
const ts = require('typescript');

const TRANSFORMER_SOURCE = fs.readFileSync(__filename, 'utf8');

module.exports = {
  // 이 파일을 고치면 이전 변환 결과(캐시)를 쓰지 않도록 키에 포함
  getCacheKey(sourceText, sourcePath) {
    return crypto
      .createHash('sha1')
      .update(TRANSFORMER_SOURCE)
      .update(sourcePath)
      .update(sourceText)
      .digest('hex');
  },
  process(sourceText, sourcePath) {
    const { outputText } = ts.transpileModule(sourceText, {
      // .mjs는 TS가 ESM으로 고정하므로 확장자를 바꿔서 CommonJS로 변환
      fileName: sourcePath.replace(/\.mjs$/, '.js'),
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });
    return { code: outputText };
  },
};
