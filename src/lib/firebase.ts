import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";

// 🟢 사용자가 제공한 Firebase 설정값
const firebaseConfig = {
  apiKey: "AIzaSyAjU8ccayAO9FbgymwPlpNJNZ_csliw7WA",
  authDomain: "solvewise-a6e5a.firebaseapp.com",
  projectId: "solvewise-a6e5a",
  storageBucket: "solvewise-a6e5a.firebasestorage.app",
  messagingSenderId: "994060844717",
  appId: "1:994060844717:web:7fc1c78060646221125024"
};

// 1. Firebase 초기화
const app = initializeApp(firebaseConfig);

// 2. 인증 서비스(Auth) 가져오기
export const auth = getAuth(app);

// 3. 로그인 제공업체(Provider) 설정
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

// 기본값으로 초기화된 앱 내보내기 (필요 시)
export default app;