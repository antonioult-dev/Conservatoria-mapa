import { getCachedAccessToken } from './firebase';

export interface SendSupportEmailParams {
  to?: string;
  category: 'SUGESTAO' | 'SUPORTE' | 'GUIA' | 'COMERCIO' | 'OUTRO';
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
}

/**
 * Envia um e-mail de suporte ou sugestão utilizando a API oficial do Gmail.
 * Requer permissão com token de acesso OAuth do usuário.
 */
export async function sendGmailSupportEmail(params: SendSupportEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const token = getCachedAccessToken();
  if (!token) {
    return {
      success: false,
      error: 'É necessário conectar com sua Conta Google para enviar o e-mail via Gmail.',
    };
  }

  const recipient = params.to || 'antoniou.lt@gmail.com';
  const categoryLabels = {
    SUGESTAO: '💡 Sugestão para o App',
    SUPORTE: '🛠️ Suporte Técnico',
    GUIA: '🧭 Dúvida / Cadastro de Guia',
    COMERCIO: '🏪 Dúvida / Cadastro Comercial',
    OUTRO: '✉️ Contato Geral',
  };

  const fullSubject = `[Conservatória Turismo] [${categoryLabels[params.category]}] ${params.subject}`;
  const fullBody = `Olá, equipe do Conservatória Turismo!

Mensagem enviada através do aplicativo oficial:

Categoria: ${categoryLabels[params.category]}
Remetente: ${params.userName}
E-mail de resposta: ${params.userEmail}
Data/Hora: ${new Date().toLocaleString('pt-BR')}

--------------------------------------------------
MENSAGEM:
${params.message}
--------------------------------------------------

Aplicativo: Conservatória Turismo PWA
Versão: 1.2
Cidade: Conservatória - Valença, RJ`;

  // Montar mensagem RFC 2822
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(fullSubject)))}?=`;
  const emailLines = [
    `To: ${recipient}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    fullBody,
  ];

  const emailRaw = emailLines.join('\r\n');
  // Base64url encode
  const base64Encoded = btoa(unescape(encodeURIComponent(emailRaw)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  try {
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: base64Encoded,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('Falha ao enviar e-mail via Gmail API:', errData);
      return {
        success: false,
        error: errData?.error?.message || `Erro ${response.status} ao comunicar com a API do Gmail.`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.id,
    };
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Erro de conexão com o Gmail:', error);
    return {
      success: false,
      error: error?.message || 'Falha de rede ao conectar com o serviço do Gmail.',
    };
  }
}
