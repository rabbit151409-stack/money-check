# Money Check

월급을 통장별로 나누고, 남는 생활비와 누적 저축을 확인하며, 가계부까지 쓸 수 있는 개인 가계 관리 앱입니다.

## 로컬에서 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173/money-check/` 로 접속합니다.

## GitHub에 올리기

이 폴더 안에서:

```bash
git init
git add .
git commit -m "first commit: money check app"
git branch -M main
git remote add origin https://github.com/rabbit151409-stack/money-check.git
git push -u origin main
```

(이미 remote가 연결돼 있다면 `git remote add` 줄은 건너뛰세요.)

## 배포 — 방법 A: GitHub Pages (자동)

이 저장소에는 `.github/workflows/deploy.yml` 이 들어 있어서, `main` 브랜치에 push하면 자동으로 빌드 후 배포됩니다. 처음 한 번만 설정해 주세요.

1. GitHub 저장소 → **Settings** → **Pages**
2. **Build and deployment** → **Source** 를 **GitHub Actions** 로 선택
3. 이후 `git push` 할 때마다 자동 배포됩니다.

배포 주소: `https://rabbit151409-stack.github.io/money-check/`

## 배포 — 방법 B: Vercel 또는 Netlify (더 간단)

1. [vercel.com](https://vercel.com) 또는 [netlify.com](https://netlify.com) 에 GitHub로 로그인
2. **New Project** → 이 저장소(`money-check`) 선택
3. 프레임워크는 **Vite** 로 자동 인식됩니다. 그대로 **Deploy**

> Vercel/Netlify로 배포할 경우 `vite.config.js` 의 `base: "/money-check/"` 를 `base: "/"` 로 바꾸거나 그 줄을 지우세요. (하위 경로가 아니라 도메인 루트에 배포되기 때문입니다.)

## 기술 스택

- Vite + React
- Tailwind CSS
- recharts (누적 저축 그래프)
- lucide-react (아이콘)
