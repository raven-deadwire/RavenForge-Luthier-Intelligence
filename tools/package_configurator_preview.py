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
    *['assets/optimized/' + name for name in (
        'edda-prototype.webp', 'embla-prototype.webp', 'askr-prototype.webp',
        'gramr-superstrat-24f.webp')]
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
- 전체·바디·지판·헤드스톡 확대
- 한국어 / 영어 / 독일어 및 좁은 화면
- 기존 가격·옵션 제약·PDF 견적

미리보기는 기존 프로토타입/컨셉 외곽을 이용한 2D 색조 참고입니다.
실제 목재 나뭇결, 제조사 픽업·브리지 형상, 튜너·후면 등의 정밀 자산은
포함하지 않습니다. 픽업·브리지는 기호이며 미확인 옵션은 빗금 또는
미표현 안내로 구분합니다. 상세 범위는 docs/CONFIGURATOR_PREVIEW.md에 있습니다.

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
