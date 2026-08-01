# Configuração do Firebase & Hospedagem Gratuita no Vercel / Netlify

## 1. Variáveis de Ambiente do Firebase (Grátis)
Crie um arquivo `.env.local` na raiz do projeto com as suas credenciais do Firebase Console (https://console.firebase.google.com):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=Sua_API_Key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=seu-app-id
```

---

## 2. Opções Recomendadas de Hospedagem 100% Gratuita

### Opção A: Vercel (Recomendado)
A Vercel é a criadora do Next.js e oferece hospedagem **totalmente gratuita** com SSL (https://), suporte a rotas dinamicas, deploy automático via GitHub e suporte nativo ao Next.js 16.

**Passos para publicar na Vercel:**
1. Acesse [vercel.com](https://vercel.com) e faça login com sua conta do GitHub (`LucasEddu`).
2. Clique em **"Add New..."** -> **"Project"**.
3. Selecione o repositório `LucasEddu/baby-tracker`.
4. Em *Environment Variables*, adicione as variáveis `NEXT_PUBLIC_FIREBASE_*`.
5. Clique em **"Deploy"**. Em menos de 1 minuto seu aplicativo estará publicado e com link `https://baby-tracker-xxx.vercel.app` para você e sua esposa usarem no celular e tablet!

---

## 3. Regras de Segurança do Firestore (firestore.rules)
Criamos o arquivo [firestore.rules](file:///c:/Users/Edwar/Projetos/baby-tracker/firestore.rules) na raiz do projeto. 

Ao criar seu banco no [Firebase Console](https://console.firebase.google.com), acesse a aba **Firestore Database ➔ Regras (Rules)** e cole a configuração abaixo:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```
*Essas regras permitem que você e sua esposa leiam e salvem todos os registros de fraldas, amamentação, vacinas e soneca sem restrição de IP.*

