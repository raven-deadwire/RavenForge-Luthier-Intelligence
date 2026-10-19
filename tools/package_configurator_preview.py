#!/usr/bin/env python3
"""Package only the isolated test page and its own/required existing assets."""
import argparse
from pathlib import Path
import zipfile
from build_configurator_standalone import build

ROOT = Path(__file__).resolve().parents[1]
FILES = [
    'assets/configurator-parts-renderer.js','docs/CONFIGURATOR_PARTS.md','assets/configurator-materials.js','assets/configurator-option-renderer.js','assets/configurator-bindrune-motifs.js',
    *[f'assets/configurator-materials/wood-{group}-atlas-v8.webp' for group in ['body','fretboard','top']],
    'assets/configurator-materials/prompts-v8.json',
    'configurator-preview.html', 'ravenforge.png',
    'assets/configurator-platforms.js', 'assets/configurator-ui.js',
    'assets/configurator-geometry.js', 'assets/configurator-preview.js',
    'assets/configurator-preview.css', 'docs/CONFIGURATOR_PREVIEW.md',
    'assets/configurator-gramr-geometry.js', 'assets/configurator-drawing-renderer.js',
    'assets/configurator-gramr-reference.svg', 'assets/configurator-materials/ash-illustrative.webp',
    'assets/configurator-materials/README.md',
    'assets/configurator-gramr-rear-reference.svg',
    'assets/configurator-bass-rear-geometry.js', 'assets/configurator-rear-renderer.js',
    'assets/configurator-rear/edda-rear-bolton-v6.webp',
    'assets/configurator-rear/embla-rear-reference.svg', 'assets/configurator-rear/askr-rear-reference.svg',
    'assets/configurator-rear/README.md',
    'assets/configurator-bindrune/README.md', 'assets/configurator-bindrune/layouts-v5.png',
    'assets/configurator-bindrune/c1.svg', 'assets/configurator-bindrune/c2.svg',
    'assets/configurator-bindrune/c3.svg', 'assets/configurator-bindrune/c4.svg',
    'Edda Prototype Design.png', 'EMBLA Prototype Design.png',
    'ASKR Prototype Design.png'
]
README = '''RavenForge 컨피규레이터 시각화 테스트 v10 / 2026-10-20

기존 홈페이지나 컨피규레이터를 교체하지 않는 별도 테스트입니다.

실행
1. ZIP 압축을 풉니다.
2. RavenForge-Configurator-Test.html을 Chrome 또는 Edge로 엽니다.
3. 앞면·뒷면·바인드룬 이미지와 로컬 코드는 HTML에 내장되어 있습니다.
   이 HTML만 다른 폴더로 옮겨도 됩니다. 별도 서버는 필요하지 않습니다.

기존 페이지와 같이 React / Tailwind / Babel / PDF 도구를 CDN에서 불러오므로
인터넷 연결이 필요합니다. source 폴더는 개발용 소스 사본입니다.

확인할 기능
- EDDA / EMBLA / ASKR / GRAMR 전환
- 바디·탑·지판 색조, 색상표·색상 선택기, 하드웨어 색상
- 확대 없는 전체 앞면·뒷면 전환
- RavenForge Oval 시안, 클릭해서 지판에 적용하는 바인드룬 v5.0 C1~C4 예시
- 지판 바인딩·퍼플링, 프렛 굵기·닷 재질·목재 노브·버스트·플레이크
- 바디·넥 피스, 목재 램프, GRAMR 도면 기반 픽가드 테스트 표시
- 픽업·브리지·튜너 샘플 형상 유지, 코일·킬스위치 별도 추가, 듀얼톤 표시
- 붉은색 등 마감색의 수종별 색조 일관성
- ASKR 멀티스케일 브리지 고정 마감
- 한국어 / 영어 / 독일어 및 좁은 화면
- 기존 가격·옵션 제약·PDF 견적

베이스 3종은 기존 RavenForge 샘플 렌더링의 질감·광택을 살린 마감 합성입니다.
GRAMR는 첨부 도면에서 추출한 벡터 외곽·배치와 별도 참고 텍스처를 사용합니다.
GRAMR 뒷면은 도면 외곽과 볼트온 5볼트 2-2-1 구조도를 표시합니다.
빗금 영역의 볼트는 구조 설명용 기호이며 실제 가공 좌표가 아닙니다. 플레이트는 없습니다.
ASKR·EMBLA 뒷면은 추가 첨부 도면의 외곽·5볼트·후면 커버·배터리 위치를 사용합니다.
EDDA 뒷면은 기존 앞면을 참고한 AI 볼트온 시안이며, 볼트 위치·힐·캐비티는 참고 배치입니다.
Opaque 마감은 원본 이미지를 블러 처리하지 않습니다.
선택한 마감 / 샘플 원본 버튼으로 비교할 수 있습니다.
수종별 참고 목재 텍스처를 적용하며 실제 재고 목재의 무늬를 확정하지 않습니다.
픽업·브리지·튜너의 잘못된 타입별 도형을 제거했습니다. 선택 제품의 실제 형상은 미반영입니다.
노브를 유지하고 추가 스위치를 별도 표시합니다. 점선 스위치 위치·램프 배치는 임시 예시입니다.
견적의 기존 컨트롤 위치 조건은 유지되므로 실제 제작 배치는 별도 확인이 필요합니다.
맞춤 부품은 원본을 유지하고 자료 필요로 표시합니다. 픽가드는 비교 전용이며 견적에 포함되지 않습니다.
EDDA·EMBLA·ASKR의 임의 픽가드는 제거했습니다. 외곽 도면이 있는 GRAMR만 표시합니다.
샘플의 새들·튜너 배열은 현행 사양과 다를 수 있습니다.
상세 범위는 docs/CONFIGURATOR_PREVIEW.md에 있습니다.

Source / review: https://github.com/raven-deadwire/RavenForge-Luthier-Intelligence/pull/35
'''

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(args.output, 'w', zipfile.ZIP_DEFLATED) as archive:
        for name in FILES:
            archive.write(ROOT / name, 'source/' + name)
        archive.writestr('RavenForge-Configurator-Test.html', build())
        archive.writestr('START-HERE.txt', README)
    print(args.output)

if __name__ == '__main__':
    main()
