import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
];

GMAIL_SCOPES.forEach((scope) => {
  googleProvider.addScope(scope);
});

googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Inicialização do Firestore
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Cache em memória do access token para APIs do Google Workspace (Gmail)
let cachedAccessToken: string | null = null;

export function getCachedAccessToken(): string | null {
  return cachedAccessToken;
}

export function setCachedAccessToken(token: string | null): void {
  cachedAccessToken = token;
}

/**
 * Autenticação via Google Popup com Workspace Scopes (Gmail) e tratamento de erros
 */
export async function signInWithGoogle(): Promise<{
  success: boolean;
  user?: FirebaseUser;
  accessToken?: string;
  error?: string;
}> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    return {
      success: true,
      user: result.user,
      accessToken: cachedAccessToken || undefined,
    };
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    console.error('Erro na autenticação com Google:', error);
    
    if (error.code === 'auth/popup-closed-by-user') {
      return { success: false, error: 'A janela de autenticação do Google foi fechada antes da confirmação.' };
    }
    if (error.code === 'auth/popup-blocked') {
      return { success: false, error: 'O navegador bloqueou a janela pop-up do Google. Permita pop-ups para este site.' };
    }
    if (error.code === 'auth/cancelled-popup-request') {
      return { success: false, error: 'Operação cancelada.' };
    }
    if (error.code?.includes('identity-toolkit-api-has-not-been-used-in-project') || error.message?.includes('identity-toolkit-api')) {
      return {
        success: false,
        error: 'A API Identity Toolkit do Google está propagando no projeto recém-provisionado. Aguarde alguns minutos ou utilize o acesso direto por e-mail/senha.',
      };
    }
    return {
      success: false,
      error: error.message || 'Falha ao autenticar com a Conta Google.',
    };
  }
}

export async function signOutFromFirebase(): Promise<void> {
  try {
    await fbSignOut(auth);
    cachedAccessToken = null;
  } catch (err) {
    console.warn('Erro ao sair do Firebase:', err);
  }
}

export { onAuthStateChanged };
