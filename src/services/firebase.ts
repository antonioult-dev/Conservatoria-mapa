import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  reauthenticateWithPopup,
  signOut as fbSignOut,
  onIdTokenChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import appletFirebaseConfig from '../../firebase-applet-config.json';

const firebaseConfig = {
  ...appletFirebaseConfig,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim() || appletFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() || appletFirebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim() || appletFirebaseConfig.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim() || appletFirebaseConfig.appId,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() || appletFirebaseConfig.messagingSenderId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() || appletFirebaseConfig.storageBucket,
  firestoreDatabaseId: import.meta.env.VITE_FIRESTORE_DATABASE_ID?.trim() || appletFirebaseConfig.firestoreDatabaseId,
};

const requiredFirebaseFields = ['apiKey', 'authDomain', 'projectId', 'appId'] as const;
const missingFirebaseFields = requiredFirebaseFields.filter((field) => !firebaseConfig[field]);
export const firebaseConfigurationError = missingFirebaseFields.length
  ? `Configuração do Firebase incompleta. Configure: ${missingFirebaseFields.map((field) => ({
      apiKey: 'VITE_FIREBASE_API_KEY', authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
      projectId: 'VITE_FIREBASE_PROJECT_ID', appId: 'VITE_FIREBASE_APP_ID',
    })[field]).join(', ')}.`
  : null;

const app = getApps().find((candidate) => candidate.name === 'conservatoria-client')
  || initializeApp(firebaseConfig, 'conservatoria-client');

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});
const gmailProvider = new GoogleAuthProvider();
gmailProvider.addScope('https://www.googleapis.com/auth/gmail.send');
gmailProvider.setCustomParameters({ prompt: 'consent select_account' });

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

export async function requestAdminClaim(): Promise<void> {
  if (!auth.currentUser) throw new Error('Entre com uma conta Google autorizada.');
  let response: Response;
  try {
    response = await fetch('/api/auth/admin-claim', {
      method: 'POST',
      headers: { Authorization: `Bearer ${await auth.currentUser.getIdToken(true)}` },
    });
  } catch {
    throw new Error('Não foi possível alcançar o servidor para validar a autorização administrativa.');
  }
  const result = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) {
    if (response.status === 403 && auth.currentUser) {
      const token = await auth.currentUser.getIdTokenResult().catch(() => null);
      if (token?.claims.admin === true) {
        await fbSignOut(auth);
        cachedAccessToken = null;
      } else {
        await auth.currentUser.getIdToken(true).catch(() => undefined);
      }
    }
    throw new Error(result.error || 'Não foi possível validar a autorização administrativa.');
  }
  await auth.currentUser.getIdToken(true);
}

/**
 * Login Firebase via Google sem solicitar acesso ao Gmail.
 */
export async function signInWithGoogle(): Promise<{
  success: boolean;
  user?: FirebaseUser;
  accessToken?: string;
  error?: string;
}> {
  try {
    cachedAccessToken = null;
    const result = await signInWithPopup(auth, googleProvider);
    return {
      success: true,
      user: result.user,
    };
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    console.error('Erro na autenticação com Google:', error.code || 'auth/unknown');
    
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
        error: 'O serviço de autenticação do Firebase ainda não está disponível. Verifique se a API Identity Toolkit está habilitada no projeto.',
      };
    }
    return {
      success: false,
      error: 'Falha ao autenticar com a Conta Google. Verifique a configuração do Firebase e tente novamente.',
    };
  }
}

/** Solicita o escopo sensível de Gmail apenas quando o usuário conecta o recurso de contato. */
export async function connectGmailWithGoogle(): Promise<{
  success: boolean;
  user?: FirebaseUser;
  error?: string;
}> {
  if (!auth.currentUser) return { success: false, error: 'Entre com sua conta Google antes de conectar o Gmail.' };
  try {
    const result = await reauthenticateWithPopup(auth.currentUser, gmailProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) return { success: false, error: 'O Google não forneceu um token de acesso ao Gmail.' };
    cachedAccessToken = credential.accessToken;
    return { success: true, user: result.user };
  } catch (err: unknown) {
    const error = err as { code?: string };
    console.error('Falha ao solicitar acesso de Gmail:', error.code || 'auth/unknown');
    if (error.code === 'auth/popup-closed-by-user') return { success: false, error: 'A janela de autorização do Gmail foi fechada.' };
    if (error.code === 'auth/popup-blocked') return { success: false, error: 'O navegador bloqueou a janela do Google. Permita pop-ups para este site.' };
    return { success: false, error: 'Não foi possível autorizar o Gmail. Verifique o consentimento OAuth e tente novamente.' };
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

export { onIdTokenChanged };
