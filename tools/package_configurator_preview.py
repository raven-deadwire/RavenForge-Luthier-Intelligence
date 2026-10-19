#!/usr/bin/env python3
"""Package only the isolated test page and its own/required existing assets."""
import argparse
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
FILES = [
    'configurator-preview.html', 'ravenforge.png',
    'assets/configurator-platforms.js', 'assets/configurator-ui.js',
    'assets/configurator-geometry.js', 'assets/configurator-preview.js',
    'assets/configurator-preview.css', 'docs/CONFIGURATOR_PREVIEW.md',
    'assets/configurator-gramr-geometry.js', 'assets/configurator-drawing-renderer.js',
    'assets/configurator-gramr-reference.svg', 'assets/configurator-materials/ash-illustrative.webp',
    'assets/configurator-materials/README.md',
    'assets/configurator-gramr-rear-reference.svg',
    'assets/configurator-bindrune/README.md', 'assets/configurator-bindrune/layouts-v5.png',
    'assets/configurator-bindrune/c1.svg', 'assets/configurator-bindrune/c2.svg',
    'assets/configurator-bindrune/c3.svg', 'assets/configurator-bindrune/c4.svg',
    'Edda Prototype Design.png', 'EMBLA Prototype Design.png',
    'ASKR Prototype Design.png'
]
README = '''RavenForge 컨피규레이터 시각화 테스트 / 2026-10-19

기존 홈페이지나 컨피규레이터를 교체하지 않는 별도 테스트입니다.

실행
1. ZIP 압축을 풉니다.
2. 압축을 푼 폴더에서 터미널을 엽니다.
3. Python이 설치된 환경에서 아래 명령을 실행합니다.
   python -m http.server 8000 --bind 127.0.0.1
   Windows에서는 python 대신 py -3을 사용할 수 있습니다.
4. 브라우저에서 다음 주소를 엽니다.
   http://127.0.0.1:8000/configurator-preview.html?lang=ko
5. 종료할 때 터미널에서 Ctrl+C를 누릅니다.

기존 페이지와 같이 React / Tailwind / Babel / PDF 도구를 CDN에서 불러오므로
인터넷 연결이 필요합니다. 파일을 직접 여는 대신 위 로컬 서버를 사용하세요.

확인할 기능
- EDDA / EMBLA / ASKR / GRAMR 전환
- 바디·탑·지판 색조, 색상표·색상 선택기, 하드웨어 색상
- 확대 없는 전체 앞면·뒷면 전환
- RavenForge Oval 시안, 바인드룬 설계 가이드 v5.0 C1~C4 예시
- 한국어 / 영어 / 독일어 및 좁은 화면
- 기존 가격·옵션 제약·PDF 견적

베이스 3종은 기존 RavenForge 샘플 렌더링의 질감·광택을 살린 마감 합성입니다.
GRAMR는 첨부 도면에서 추출한 벡터 외곽·배치와 별도 참고 텍스처를 사용합니다.
GRAMR 뒷면은 도면 외곽·배치를 사용하며, 과거 4볼트 플레이트는 제외합니다.
EDDA·EMBLA·ASKR 뒷면은 확인된 자산이 없어 미등록 상태로 표시합니다.
Opaque 마감은 원본 이미지를 블러 처리하지 않습니다.
선택한 마감 / 샘플 원본 버튼으로 비교할 수 있습니다.
목재는 색조를 변경하며 샘플 무늬를 유지합니다. 픽업·브리지·튜너 형상도
샘플을 유지하므로 정확한 선택 부품이나 최종 제작 이미지를 의미하지 않습니다.
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
            archive.write(ROOT / name, name)
        archive.writestr('START-HERE.txt', README)
    print(args.output)

if __name__ == '__main__':
    main()
