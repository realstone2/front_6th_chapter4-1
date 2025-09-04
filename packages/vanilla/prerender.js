import { setupServer } from "msw/node";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handlers } from "./src/mocks/handlers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ssgMswServer = setupServer(...handlers);

async function prerender() {
  console.log("🚀 Starting Static Site Generation...");

  // MSW 서버 시작
  console.log("🔧 MSW 서버 시작 중...");
  try {
    ssgMswServer.listen({
      onUnhandledRequest: "bypass",
    });
    console.log("✅ MSW 서버 시작 완료");
  } catch (error) {
    console.error("❌ MSW 서버 시작 실패:", error);
    process.exit(1);
  }

  try {
    // 빌드된 파일들이 있는지 확인
    const distPath = path.join(__dirname, "dist", "vanilla-ssr");
    const mainServerPath = path.join(distPath, "main-server.js");

    // 빌드된 파일들 확인
    try {
      await fs.access(mainServerPath);
    } catch (error) {
      console.error("❌ 빌드된 파일을 찾을 수 없습니다. 먼저 'npm run build'를 실행해주세요.", error);
      process.exit(1);
    }

    // items.json 파일 읽기
    const itemsPath = path.join(__dirname, "src", "mocks", "items.json");
    const itemsData = await fs.readFile(itemsPath, "utf-8");
    const items = JSON.parse(itemsData);

    console.log(`📦 총 ${items.length}개의 상품을 발견했습니다.`);

    // 템플릿 HTML 읽기
    const templatePath = path.join(__dirname, "dist", "vanilla", "index.html");
    const template = await fs.readFile(templatePath, "utf-8");

    // 렌더링 함수 가져오기
    const { render } = await import("./dist/vanilla-ssr/main-server.js");

    // 출력 디렉토리 생성
    const outputDir = path.join(__dirname, "dist", "vanilla-ssg");
    await fs.mkdir(outputDir, { recursive: true });

    // 홈페이지 생성
    console.log("🏠 홈페이지 생성 중...");
    const homeRendered = await render("/", {});
    const homeHtml = template
      .replace(`<!--app-head-->`, homeRendered.head ?? "")
      .replace(`<!--app-html-->`, homeRendered.html ?? "")
      .replace(
        `<!--ssr-data-->`,
        `<script>window.__INITIAL_MODEL__ = ${JSON.stringify(homeRendered.serverData)}</script>`,
      );

    await fs.writeFile(path.join(outputDir, "index.html"), homeHtml);
    console.log("✅ 홈페이지 생성 완료");

    // 각 상품 페이지 생성
    console.log("🛍️ 상품 페이지들 생성 중...");
    let completed = 0;
    const total = items.length;

    // 배치 처리를 위한 함수
    const processInBatches = async (items, batchSize = 10) => {
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const promises = batch.map(async (item) => {
          const productId = item.productId;
          const url = `/product/${productId}/`;

          try {
            const rendered = await render(url, {});
            const html = template
              .replace(`<!--app-head-->`, rendered.head ?? "")
              .replace(`<!--app-html-->`, rendered.html ?? "")
              .replace(
                `<!--ssr-data-->`,
                `<script>window.__INITIAL_MODEL__ = ${JSON.stringify(rendered.serverData)}</script>`,
              );

            // 상품 디렉토리 생성
            const productDir = path.join(outputDir, "product", productId);
            await fs.mkdir(productDir, { recursive: true });

            // HTML 파일 저장
            await fs.writeFile(path.join(productDir, "index.html"), html);

            completed++;
            if (completed % 50 === 0 || completed === total) {
              console.log(`📄 진행률: ${completed}/${total} (${Math.round((completed / total) * 100)}%)`);
            }
          } catch (error) {
            console.error(`❌ 상품 ${productId} 처리 중 오류:`, error.message);
          }
        });

        await Promise.all(promises);
      }
    };

    await processInBatches(items, 10);

    // 404 페이지 생성
    console.log("📄 404 페이지 생성 중...");
    const notFoundRendered = await render("/not-found", {});
    const notFoundHtml = template
      .replace(`<!--app-head-->`, notFoundRendered.head ?? "")
      .replace(`<!--app-html-->`, notFoundRendered.html ?? "")
      .replace(
        `<!--ssr-data-->`,
        `<script>window.__INITIAL_MODEL__ = ${JSON.stringify(notFoundRendered.serverData)}</script>`,
      );

    await fs.writeFile(path.join(outputDir, "404.html"), notFoundHtml);
    console.log("✅ 404 페이지 생성 완료");

    // 정적 자산 복사
    console.log("📁 정적 자산 복사 중...");
    const staticAssetsDir = path.join(__dirname, "dist", "vanilla", "assets");
    const outputAssetsDir = path.join(outputDir, "assets");

    try {
      await fs.access(staticAssetsDir);
      await fs.cp(staticAssetsDir, outputAssetsDir, { recursive: true });
      console.log("✅ 정적 자산 복사 완료");
    } catch (error) {
      console.log("⚠️ 정적 자산을 찾을 수 없습니다.", error);
    }

    // 아이콘 및 기타 파일들 복사
    const publicFiles = [
      "404.svg",
      "back-icon.svg",
      "cart-header-icon.svg",
      "cart-icon.svg",
      "chevron-right-icon.svg",
      "close-icon-white.svg",
      "close-icon.svg",
      "empty-cart-icon.svg",
      "error-icon.svg",
      "error-large-icon.svg",
      "info-icon.svg",
      "loading-icon.svg",
      "minus-icon.svg",
      "plus-icon.svg",
      "quantity-minus-icon.svg",
      "quantity-plus-icon.svg",
      "search-icon.svg",
      "search-large-icon.svg",
      "star-icon.svg",
      "success-icon.svg",
      "warning-icon.svg",
    ];

    for (const file of publicFiles) {
      try {
        const sourcePath = path.join(__dirname, "dist", "vanilla-ssg", file);
        const targetPath = path.join(outputDir, file);
        await fs.copyFile(sourcePath, targetPath);
      } catch (error) {
        console.warn("⚠️ 정적 자산 복사 중 오류:", error.message);
      }
    }

    console.log(`🎉 Static Site Generation 완료!`);
    console.log(`📊 총 ${completed + 2}개의 페이지가 생성되었습니다:`);
    console.log(`   - 홈페이지: 1개`);
    console.log(`   - 상품 페이지: ${completed}개`);
    console.log(`   - 404 페이지: 1개`);
    console.log(`📂 출력 디렉토리: ${outputDir}`);

    // MSW 서버 정리
    try {
      ssgMswServer.close();
      console.log("🔧 MSW 서버 정리 완료");
    } catch (error) {
      console.warn("⚠️ MSW 서버 정리 중 오류:", error.message);
    }
  } catch (error) {
    console.error("❌ SSG 처리 중 오류 발생:", error);

    // 오류 발생 시에도 MSW 서버 정리
    try {
      ssgMswServer.close();
    } catch (cleanupError) {
      console.warn("⚠️ MSW 서버 정리 중 오류:", cleanupError.message);
    }

    process.exit(1);
  }
}

// 스크립트 실행
prerender().catch(console.error);
